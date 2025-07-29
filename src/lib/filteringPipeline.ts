/**
 * FilteringPipeline - Single-pass filtering system for package data
 * 
 * Combines license filtering, package filtering, and processing into a single
 * efficient pass through the data, eliminating the need for multiple iterations.
 */

import chalk from 'chalk';

// @ts-ignore
import spdxCorrect from 'spdx-correct';
// @ts-ignore
import spdxSatisfies from 'spdx-satisfies';

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

	constructor(options: FilterOptions) {
		this.options = options;
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
	private passesPackageFilters(packageName: string, packageData: PackageData): boolean {
		const { includePackages, excludePackages, excludePackagesStartingWith } = this.options;

		// Include packages whitelist
		if (includePackages?.length) {
			const isIncluded = includePackages.some(whitelistPackage => 
				packageName.startsWith(
					whitelistPackage.lastIndexOf('@') > 0 ? whitelistPackage : `${whitelistPackage}@`
				)
			);
			if (!isIncluded) return false;
		}

		// Exclude packages blacklist
		if (excludePackages?.length) {
			const isExcluded = excludePackages.some(blacklistPackage => 
				packageName.startsWith(
					blacklistPackage.lastIndexOf('@') > 0 ? blacklistPackage : `${blacklistPackage}@`
				)
			);
			if (isExcluded) return false;
		}

		// Exclude packages starting with specific strings
		if (excludePackagesStartingWith?.length) {
			const isExcluded = excludePackagesStartingWith.some(prefix => 
				packageName.startsWith(prefix)
			);
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
			transformed.licenses = this.options.colorize ? 
				chalk.bold.red('UNLICENSED') : 'UNLICENSED';
		}

		// Handle unknown licenses
		if (!transformed.licenses) {
			transformed.licenses = this.options.colorize ? 
				chalk.bold.red('UNKNOWN') : 'UNKNOWN';
		}

		// Handle guessed licenses (marked with *)
		if (this.options.onlyunknown && transformed.licenses && 
			typeof transformed.licenses === 'string' && transformed.licenses.indexOf('*') > -1) {
			transformed.licenses = this.options.colorize ? 
				chalk.bold.red('UNKNOWN') : 'UNKNOWN';
		}

		// Adjust relative module paths
		if (this.options.relativeModulePath && transformed.path && this.options.startPath) {
			transformed.path = transformed.path.replace(this.options.startPath + '/', '');
		}

		return transformed;
	}

	/**
	 * Check fail conditions that can exit the process
	 */
	private checkFailConditions(packageName: string, packageData: PackageData): void {
		const { failOn, onlyAllow } = this.options;
		const currentLicense = packageData.licenses;

		if (!currentLicense) return;

		// Check failOn conditions
		if (failOn?.length) {
			const licenseString = Array.isArray(currentLicense) ? currentLicense.join(', ') : currentLicense;
			if (failOn.includes(licenseString)) {
				console.error(`Found license defined by the --failOn flag: "${licenseString}". Exiting.`);
				process.exit(1);
			}
		}

		// Check onlyAllow conditions
		if (onlyAllow?.length) {
			const licenseString = Array.isArray(currentLicense) ? currentLicense.join(', ') : currentLicense;
			let containsAllowedLicense = false;

			for (const allowedLicense of onlyAllow) {
				if (licenseString.includes(allowedLicense)) {
					containsAllowedLicense = true;
					break;
				}
			}

			if (!containsAllowedLicense) {
				console.error(
					`Package "${packageName}" is licensed under "${licenseString}" which is not permitted by the --onlyAllow flag. Exiting.`
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
		const invalidSPDXLicenses = compareLicenses.map(transformBSD).filter(l => !spdxIsValid(l));
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
			rejectionRate: this.processedCount > 0 ? 
				(this.processedCount - this.filteredCount) / this.processedCount : 0
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