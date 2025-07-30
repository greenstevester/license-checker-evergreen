/**
 * Memory-efficient package data structure with lazy evaluation
 * Eliminates redundant object copies and defers expensive computations
 */

import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import semver from 'semver';
import type { LicenseFileCache } from './licenseFileCache.js';
import { licenseFiles } from './license-files.js';
import { getLicenseTitle } from './getLicenseTitle.js';

export interface PackageData {
	name?: string;
	description?: string;
	version?: string;
	repository?: string;
	homepage?: string;
	author?: string;
	licenses?: string | string[];
	licenseFile?: string;
	licenseText?: string;
	licenseModified?: string;
	path?: string;
	realPath?: string;
	private?: boolean;
	publisher?: string;
	email?: string;
	url?: string;
}

export class PackageInfo {
	private _packageJson?: any;
	private _licenseText?: string;
	private _licenseFile?: string;
	private _licenses?: string | string[];
	private _computedData?: Partial<PackageData>;

	constructor(
		public readonly path: string,
		public readonly realPath: string,
		private readonly cache: LicenseFileCache,
		private readonly clarifications?: any,
	) {}

	/**
	 * Lazy-loaded package.json data
	 */
	private get packageJson(): any {
		if (!this._packageJson) {
			try {
				const packagePath = resolve(this.realPath, 'package.json');
				const content = this.cache.readLicenseFile(packagePath);
				this._packageJson = JSON.parse(content.content);
			} catch {
				this._packageJson = {};
			}
		}
		return this._packageJson;
	}

	/**
	 * Get package name with efficient caching
	 */
	get name(): string {
		return this.packageJson.name || '';
	}

	/**
	 * Get package version with efficient caching
	 */
	get version(): string {
		return this.packageJson.version || '';
	}

	/**
	 * Get basic package data without expensive operations
	 */
	getBasicData(): Pick<PackageData, 'name' | 'version' | 'path' | 'realPath' | 'private'> {
		return {
			name: this.name,
			version: this.version,
			path: this.path,
			realPath: this.realPath,
			private: this.packageJson.private || false,
		};
	}

	/**
	 * Lazy evaluation of license detection
	 */
	private computeLicenseInfo(): void {
		if (this._licenses !== undefined) {
			return; // Already computed
		}

		const pkg = this.packageJson;
		let clarification = null;

		// Handle clarifications object (as used in original code)
		if (this.clarifications && pkg.name && pkg.version) {
			const clarificationsList = this.clarifications[pkg.name];
			if (Array.isArray(clarificationsList)) {
				clarification = clarificationsList.find(
					(c: any) => pkg.version === c.semverRange || semver.satisfies(pkg.version, c.semverRange),
				);
			}
		}

		if (clarification) {
			this._licenses = clarification.licenses || clarification;
			this._licenseFile = clarification.licenseFile;
			return;
		}

		// Extract from package.json
		this._licenses = pkg.license || pkg.licenses;

		// Find license files only if needed
		if (!this._licenses || this._licenses === 'UNKNOWN') {
			this.findLicenseFile();
		}
	}

	/**
	 * Find license file with minimal I/O
	 */
	private findLicenseFile(): void {
		try {
			const files = readdirSync(this.realPath);

			const licenseFileList = licenseFiles(files);
			if (licenseFileList.length > 0) {
				this._licenseFile = join(this.realPath, licenseFileList[0]);

				// Only read file content if we need to extract license info
				if (!this._licenses || this._licenses === 'UNKNOWN') {
					const fileContent = this.cache.readLicenseFile(this._licenseFile);
					this._licenseText = fileContent.content;
					this._licenses = getLicenseTitle(fileContent.content) || 'UNKNOWN';
				}
			}
		} catch {
			// Silently handle directory read errors
		}
	}

	/**
	 * Get license information with lazy evaluation
	 */
	get licenses(): string | string[] {
		this.computeLicenseInfo();
		return this._licenses || 'UNKNOWN';
	}

	/**
	 * Get license file path with lazy evaluation
	 */
	get licenseFile(): string | undefined {
		this.computeLicenseInfo();
		return this._licenseFile;
	}

	/**
	 * Get license text with lazy evaluation (only when needed)
	 */
	getLicenseText(): string | undefined {
		this.computeLicenseInfo();
		if (this._licenseText) {
			return this._licenseText;
		}

		// Load text on demand
		if (this._licenseFile) {
			const fileContent = this.cache.readLicenseFile(this._licenseFile);
			this._licenseText = fileContent.content;
		}

		return this._licenseText;
	}

	/**
	 * Generate complete package data with lazy evaluation
	 * Only computes expensive fields when accessed
	 */
	toPackageData(): PackageData {
		if (this._computedData) {
			return this._computedData;
		}

		const pkg = this.packageJson;
		const basic = this.getBasicData();

		this._computedData = {
			...basic,
			description: pkg.description,
			repository: this.extractRepository(pkg),
			homepage: pkg.homepage,
			author: this.extractAuthor(pkg),
			licenses: this.licenses,
			licenseFile: this.licenseFile,
			publisher: this.extractPublisher(pkg),
			email: this.extractEmail(pkg),
			url: this.extractUrl(pkg),
		};

		return this._computedData;
	}

	/**
	 * Generate package data with license text (expensive operation)
	 */
	toPackageDataWithText(): PackageData {
		const data = this.toPackageData();
		return {
			...data,
			licenseText: this.getLicenseText(),
			licenseModified: this.licenseFile,
		};
	}

	/**
	 * Efficient repository extraction
	 */
	private extractRepository(pkg: any): string | undefined {
		if (typeof pkg.repository === 'string') {
			return pkg.repository;
		}
		return pkg.repository?.url;
	}

	/**
	 * Efficient author extraction
	 */
	private extractAuthor(pkg: any): string | undefined {
		if (typeof pkg.author === 'string') {
			return pkg.author;
		}
		return pkg.author?.name;
	}

	/**
	 * Efficient publisher extraction
	 */
	private extractPublisher(pkg: any): string | undefined {
		if (pkg.author) {
			return typeof pkg.author === 'string' ? pkg.author : pkg.author.name;
		}
		return pkg.maintainers?.[0]?.name;
	}

	/**
	 * Efficient email extraction
	 */
	private extractEmail(pkg: any): string | undefined {
		if (typeof pkg.author === 'object' && pkg.author?.email) {
			return pkg.author.email;
		}
		return pkg.maintainers?.[0]?.email;
	}

	/**
	 * Efficient URL extraction
	 */
	private extractUrl(pkg: any): string | undefined {
		if (typeof pkg.author === 'object' && pkg.author?.url) {
			return pkg.author.url;
		}
		return pkg.homepage || pkg.repository?.url;
	}

	/**
	 * Memory cleanup - clear cached expensive data
	 */
	clearCache(): void {
		this._licenseText = undefined;
		this._computedData = undefined;
	}

	/**
	 * Get memory usage statistics
	 */
	getMemoryStats(): { cached: boolean; hasLicenseText: boolean; size: number } {
		return {
			cached: !!this._computedData,
			hasLicenseText: !!this._licenseText,
			size: (this._licenseText?.length || 0) + JSON.stringify(this._computedData || {}).length,
		};
	}
}
