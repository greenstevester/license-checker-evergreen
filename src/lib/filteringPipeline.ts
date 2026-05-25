/**
 * FilteringPipeline - Single-pass filtering system for package data
 *
 * Combines license filtering, package filtering, and processing into a single
 * efficient pass through the data, eliminating the need for multiple iterations.
 */

import chalk from 'chalk';

// @ts-ignore - No type definitions available for spdx-correct
import spdxCorrect from 'spdx-correct';
// @ts-ignore - No type definitions available for spdx-satisfies
import spdxSatisfies from 'spdx-satisfies';
// @ts-ignore - No type definitions available for spdx-expression-parse
import spdxExpressionParse from 'spdx-expression-parse';

type ParsedSpdx =
	| { license: string; plus?: boolean; exception?: string }
	| { conjunction: 'and' | 'or'; left: ParsedSpdx; right: ParsedSpdx };

const MAX_SPDX_LEN = 4096;

interface FilterOptions {
	excludeLicenses?: string[];
	includeLicenses?: string[];
	includePackages?: string[];
	excludePackages?: string[];
	excludePackagesStartingWith?: string[];
	excludePrivatePackages?: boolean;
	onlyunknown?: boolean;
	failOn?: string[];
	onlyAllow?: string[];
	colorize?: boolean;
	relativeModulePath?: boolean;
	startPath?: string;
	spdxSemantics?: boolean;
	failOnUnavoidableOnly?: boolean;
}

interface PackageData {
	licenses: string | string[];
	private?: boolean;
	path?: string;
	[key: string]: any;
}

export class FilteringPipeline {
	private options: FilterOptions;
	private processedCount = 0;
	private filteredCount = 0;
	private failedPackages: string[] = [];

	// Precomputed allow/deny classification (populated only when spdxSemantics === true)
	private spdxAllowNormalized!: Set<string>;
	private literalAllowSet!: Set<string>;
	private spdxDenyNormalized!: Set<string>;
	private literalDenySet!: Set<string>;
	private spdxExprCache!: Map<string, { ok: true; ast: ParsedSpdx } | { ok: false }>;

	constructor(options: FilterOptions) {
		this.options = options;

		if (options.spdxSemantics === true) {
			this.spdxAllowNormalized = new Set<string>();
			this.literalAllowSet = new Set<string>();
			this.spdxDenyNormalized = new Set<string>();
			this.literalDenySet = new Set<string>();
			this.spdxExprCache = new Map();

			for (const entry of options.failOn ?? []) {
				this.classifyEntry(entry, this.spdxDenyNormalized, this.literalDenySet);
			}
			for (const entry of options.onlyAllow ?? []) {
				this.classifyEntry(entry, this.spdxAllowNormalized, this.literalAllowSet);
			}
		}
	}

	/**
	 * Classify a single allow/deny entry.
	 *
	 * spdx-expression-parse is strict (rejects lowercase like "gpl-2.0"), but
	 * spdx-correct is lenient enough to silently squash "MIT-restricted-do-not-use"
	 * into "MIT". We want case/canonical normalization ("gpl-2.0" → "GPL-2.0-only")
	 * but NOT substring correction. Strategy:
	 *
	 *  1. If the trimmed entry parses as SPDX → normalize via spdxCorrect and
	 *     store in `spdxSet`.
	 *  2. Otherwise try spdxCorrect for case normalization. Accept the correction
	 *     only when the entry's canonical-letters form is a prefix of the
	 *     corrected form (rejects substring corrections that drop content).
	 *  3. Otherwise store the trimmed raw string in `literalSet`.
	 */
	private classifyEntry(entry: string, spdxSet: Set<string>, literalSet: Set<string>): void {
		const trimmed = String(entry).trim();
		if (trimmed === '') return;
		try {
			spdxExpressionParse(trimmed);
			spdxSet.add(spdxCorrect(trimmed) ?? trimmed);
			return;
		} catch {
			// fall through to case-normalization attempt
		}
		const corrected = spdxCorrect(trimmed);
		if (corrected !== null) {
			const canonical = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');
			const entryCanon = canonical(trimmed);
			const correctedCanon = canonical(corrected);
			if (correctedCanon.startsWith(entryCanon)) {
				spdxSet.add(corrected);
				return;
			}
		}
		literalSet.add(trimmed);
	}

	/**
	 * Parse `expr` via spdx-expression-parse, caching successes AND failures.
	 */
	private parseSpdxCached(expr: string): { ok: true; ast: ParsedSpdx } | { ok: false } {
		const cached = this.spdxExprCache.get(expr);
		if (cached) return cached;
		let result: { ok: true; ast: ParsedSpdx } | { ok: false };
		try {
			const ast = spdxExpressionParse(expr) as ParsedSpdx;
			result = { ok: true, ast };
		} catch {
			result = { ok: false };
		}
		this.spdxExprCache.set(expr, result);
		return result;
	}

	/**
	 * Walk the SPDX AST visiting each leaf. Returns true as soon as `visit`
	 * returns true for any leaf; false otherwise. O(n) in AST node count.
	 */
	private walkSpdxLeaves(ast: ParsedSpdx, visit: (license: string) => boolean): boolean {
		if ('license' in ast) {
			return visit(ast.license);
		}
		return this.walkSpdxLeaves(ast.left, visit) || this.walkSpdxLeaves(ast.right, visit);
	}

	/**
	 * Reduce the SPDX AST to a boolean: leaves are evaluated by `visit`;
	 * `and` branches AND the result; `or` branches OR the result.
	 */
	private reduceSpdxBool(ast: ParsedSpdx, visit: (license: string) => boolean): boolean {
		if ('license' in ast) {
			return visit(ast.license);
		}
		const left = this.reduceSpdxBool(ast.left, visit);
		const right = this.reduceSpdxBool(ast.right, visit);
		return ast.conjunction === 'and' ? left && right : left || right;
	}

	/**
	 * Returns true if `licenseExpr` should FAIL under --failOn in spdxSemantics mode.
	 */
	private evaluateSpdxDeny(licenseExpr: string): boolean {
		const raw = String(licenseExpr);
		if (raw.length > MAX_SPDX_LEN) return false;
		const trimmed = raw.trim();
		if (trimmed === '') return false;

		if (this.literalDenySet.has(trimmed)) return true;

		const parsed = this.parseSpdxCached(raw);
		if (!parsed.ok) return false; // non-SPDX + no literal match → pass under failOn

		const denySet = this.spdxDenyNormalized;

		if (this.options.failOnUnavoidableOnly === true) {
			// Fail only if the denied license is UNAVOIDABLE: there is no way to satisfy
			// the expression without it. `avoidable` is true when some satisfying choice
			// uses no denied license (OR lets you pick the clean branch; AND requires every
			// branch clean) — the De Morgan dual of the onlyAllow evaluation, so --failOn
			// and --onlyAllow agree on the same expression. e.g. "(MIT OR GPL-3.0)" + deny
			// GPL-3.0 passes, because the package is usable under MIT.
			const avoidable = this.reduceSpdxBool(parsed.ast, (leaf) => {
				const normalized = spdxCorrect(leaf) ?? leaf;
				return !denySet.has(normalized);
			});
			return !avoidable;
		}

		// Default (strict): fail if the denied license appears ANYWHERE in the
		// expression, regardless of AND/OR structure. e.g. "(MIT OR GPL-3.0)" + deny
		// GPL-3.0 fails, even though the package is usable under MIT.
		return this.walkSpdxLeaves(parsed.ast, (leaf) => {
			const normalized = spdxCorrect(leaf) ?? leaf;
			return denySet.has(normalized);
		});
	}

	/**
	 * Returns true if `licenseExpr` is ALLOWED under --onlyAllow in spdxSemantics mode.
	 */
	private evaluateSpdxAllow(licenseExpr: string): boolean {
		const raw = String(licenseExpr);
		if (raw.length > MAX_SPDX_LEN) return false;
		const trimmed = raw.trim();
		if (trimmed === '') return false;

		if (this.literalAllowSet.has(trimmed)) return true;

		const parsed = this.parseSpdxCached(raw);
		if (!parsed.ok) return false; // non-SPDX + no literal match → reject under onlyAllow

		const allowSet = this.spdxAllowNormalized;
		return this.reduceSpdxBool(parsed.ast, (leaf) => {
			const normalized = spdxCorrect(leaf) ?? leaf;
			return allowSet.has(normalized);
		});
	}

	/**
	 * Process a single package through the complete filtering pipeline
	 * Returns null if package should be filtered out, otherwise returns processed package data
	 */
	processPackage(packageName: string, packageData: PackageData): PackageData | null {
		this.processedCount++;

		// Apply all filters in sequence - if any filter rejects, return null
		if (!this.passesLicenseFilters(packageName, packageData)) return null;
		if (!this.passesPackageFilters(packageName, packageData)) return null;
		if (!this.passesPrivateFilter(packageData)) return null;
		if (!this.passesUnknownFilter(packageData)) return null;

		// Apply transformations to the package data
		const processedData = this.applyTransformations(packageName, packageData);

		// Check fail conditions - these can exit the process
		this.checkFailConditions(packageName, processedData);

		this.filteredCount++;
		return processedData;
	}

	/**
	 * License-based filtering (excludeLicenses, includeLicenses)
	 */
	private passesLicenseFilters(packageName: string, packageData: PackageData): boolean {
		const { excludeLicenses, includeLicenses } = this.options;

		if (!excludeLicenses?.length && !includeLicenses?.length) {
			return true; // No license filters
		}

		const licenses = packageData.licenses;
		if (!licenses) return true;

		const licensesArr = Array.isArray(licenses) ? licenses : [licenses];

		// Check exclude licenses
		if (excludeLicenses?.length) {
			const licenseMatch = this.getLicenseMatch(licensesArr, excludeLicenses);
			if (licenseMatch) return false; // Excluded
		}

		// Check include licenses
		if (includeLicenses?.length) {
			const licenseMatch = this.getLicenseMatch(licensesArr, includeLicenses);
			if (!licenseMatch) return false; // Not included
		}

		return true;
	}

	/**
	 * Package name-based filtering
	 */
	private passesPackageFilters(packageName: string, _packageData: PackageData): boolean {
		const { includePackages, excludePackages, excludePackagesStartingWith } = this.options;

		// Include packages whitelist
		if (includePackages?.length) {
			const isIncluded = includePackages.some((whitelistPackage) =>
				packageName.startsWith(
					whitelistPackage.lastIndexOf('@') > 0 ? whitelistPackage : `${whitelistPackage}@`,
				),
			);
			if (!isIncluded) return false;
		}

		// Exclude packages blacklist
		if (excludePackages?.length) {
			const isExcluded = excludePackages.some((blacklistPackage) =>
				packageName.startsWith(
					blacklistPackage.lastIndexOf('@') > 0 ? blacklistPackage : `${blacklistPackage}@`,
				),
			);
			if (isExcluded) return false;
		}

		// Exclude packages starting with specific strings
		if (excludePackagesStartingWith?.length) {
			const isExcluded = excludePackagesStartingWith.some((prefix) => packageName.startsWith(prefix));
			if (isExcluded) return false;
		}

		return true;
	}

	/**
	 * Private package filtering
	 */
	private passesPrivateFilter(packageData: PackageData): boolean {
		if (this.options.excludePrivatePackages && packageData.private) {
			return false;
		}
		return true;
	}

	/**
	 * Unknown license filtering
	 */
	private passesUnknownFilter(packageData: PackageData): boolean {
		if (!this.options.onlyunknown) return true;

		const licenses = packageData.licenses;
		if (typeof licenses === 'string') {
			return licenses.indexOf('*') > -1 || licenses.indexOf('UNKNOWN') > -1;
		}
		return false;
	}

	/**
	 * Apply transformations to package data (colorization, path adjustments)
	 */
	private applyTransformations(packageName: string, packageData: PackageData): PackageData {
		const transformed = { ...packageData };

		// Handle private packages
		if (transformed.private) {
			transformed.licenses = this.options.colorize ? chalk.bold.red('UNLICENSED') : 'UNLICENSED';
		}

		// Handle unknown licenses
		if (!transformed.licenses) {
			transformed.licenses = this.options.colorize ? chalk.bold.red('UNKNOWN') : 'UNKNOWN';
		}

		// Handle guessed licenses (marked with *)
		if (
			this.options.onlyunknown &&
			transformed.licenses &&
			typeof transformed.licenses === 'string' &&
			transformed.licenses.indexOf('*') > -1
		) {
			transformed.licenses = this.options.colorize ? chalk.bold.red('UNKNOWN') : 'UNKNOWN';
		}

		// Adjust relative module paths
		if (this.options.relativeModulePath && transformed.path && this.options.startPath) {
			transformed.path = transformed.path.replace(this.options.startPath + '/', '');
		}

		return transformed;
	}

	/**
	 * Check fail conditions that can exit the process.
	 *
	 * In legacy mode (no --spdxSemantics), keeps today's behavior byte-identically:
	 * literal equality for --failOn, substring match for --onlyAllow.
	 *
	 * In spdxSemantics mode, delegates to evaluateSpdxDeny / evaluateSpdxAllow.
	 * Array licenses are reshaped as "(A OR B)" for SPDX parsing (vs "A, B" in legacy).
	 */
	private checkFailConditions(packageName: string, packageData: PackageData): void {
		const { failOn, onlyAllow } = this.options;
		const currentLicense = packageData.licenses;

		if (!currentLicense) return;

		const spdx = this.options.spdxSemantics === true;
		const licenseString = spdx
			? Array.isArray(currentLicense)
				? `(${currentLicense.join(' OR ')})`
				: String(currentLicense)
			: Array.isArray(currentLicense)
				? currentLicense.join(', ')
				: String(currentLicense);

		// Check failOn conditions
		if (failOn?.length) {
			const shouldFail = spdx ? this.evaluateSpdxDeny(licenseString) : failOn.includes(licenseString);
			if (shouldFail) {
				console.error(`Found license defined by the --failOn flag: "${licenseString}". Exiting.`);
				process.exit(1);
			}
		}

		// Check onlyAllow conditions
		if (onlyAllow?.length) {
			const allowed = spdx
				? this.evaluateSpdxAllow(licenseString)
				: onlyAllow.some((a) => licenseString.includes(a));
			if (!allowed) {
				console.error(
					`Package "${packageName}" is licensed under "${licenseString}" which is not permitted by the --onlyAllow flag. Exiting.`,
				);
				process.exit(1);
			}
		}
	}

	/**
	 * Enhanced license matching logic with SPDX support
	 */
	private getLicenseMatch(licensesArr: string[], compareLicenses: string[]): boolean {
		const transformBSD = (spdx: string) =>
			spdx === 'BSD' ? '(0BSD OR BSD-2-Clause OR BSD-3-Clause OR BSD-4-Clause)' : spdx;

		const spdxIsValid = (spdx: string) => spdxCorrect(spdx) === spdx;
		const validSPDXLicenses = compareLicenses.map(transformBSD).filter(spdxIsValid);
		const invalidSPDXLicenses = compareLicenses.map(transformBSD).filter((l) => !spdxIsValid(l));
		const spdxExcluder = `( ${validSPDXLicenses.join(' OR ')} )`;

		let match = false;

		for (let license of licensesArr) {
			if (license.indexOf('UNKNOWN') >= 0) {
				match = true;
				break;
			}

			if (license.endsWith('*')) {
				license = license.slice(0, -1);
			}

			license = transformBSD(license);

			if (
				invalidSPDXLicenses.indexOf(license) >= 0 ||
				(spdxCorrect(license) &&
					validSPDXLicenses.length > 0 &&
					spdxSatisfies(spdxCorrect(license), spdxExcluder))
			) {
				match = true;
				break;
			}
		}

		return match;
	}

	/**
	 * Get processing statistics
	 */
	getStats(): { processed: number; filtered: number; rejectionRate: number } {
		return {
			processed: this.processedCount,
			filtered: this.filteredCount,
			rejectionRate:
				this.processedCount > 0 ? (this.processedCount - this.filteredCount) / this.processedCount : 0,
		};
	}

	/**
	 * Reset statistics
	 */
	reset(): void {
		this.processedCount = 0;
		this.filteredCount = 0;
		this.failedPackages = [];
	}
}
