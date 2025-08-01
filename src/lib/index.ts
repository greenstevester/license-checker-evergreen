/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/

// @ts-nocheck - Legacy code with extensive dynamic typing that requires major refactoring for full TypeScript compliance

// Main license checking module with complex third-party library integrations

const LICENSE_TITLE_UNKNOWN = 'UNKNOWN';
const LICENSE_TITLE_UNLICENSED = 'UNLICENSED';

interface ModuleInfo {
	licenses: string | string[];
	private?: boolean;
	repository?: string;
	url?: string;
	publisher?: string;
	email?: string;
	dependencyPath?: string;
	path?: string;
	licenseFile?: string;
	licenseText?: string;
	copyright?: string;
	noticeFile?: string;
	[key: string]: any;
}

const INITIAL_MODULE_INFO: ModuleInfo = {
	licenses: LICENSE_TITLE_UNKNOWN,
};

import chalk from 'chalk';
import debug from 'debug';
import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import { mkdirp } from 'mkdirp';
import path from 'node:path';

// @ts-ignore - No TypeScript definitions available for read-installed-packages
import readInstalledPackages from 'read-installed-packages';

// Simple pass-through wrapper - the original library seems to work fine now
// We'll use the original readInstalledPackages directly
const readInstalledPackagesSafe = readInstalledPackages;

// @ts-ignore - No TypeScript definitions available for spdx-correct
import spdxCorrect from 'spdx-correct';

// @ts-ignore - No TypeScript definitions available for spdx-satisfies
import spdxSatisfies from 'spdx-satisfies';
import treeify from 'treeify';
import semver from 'semver';

import * as licenseCheckerHelpers from './licenseCheckerHelpers.js';
import { getLicenseTitle } from './getLicenseTitle.js';
import { licenseFiles } from './license-files.js';
import * as helpers from './indexHelpers.js';
import { licenseFileCache } from './licenseFileCache.js';
import { FilteringPipeline } from './filteringPipeline.js';
import { PackageInfo } from './packageInfo.js';
import { PackageCollection } from './packageCollection.js';

// Set up debug logging
// https://www.npmjs.com/package/debug#stderr-vs-stdout
const debugError = debug('license-checker-evergreen:error');
const debugLog = debug('license-checker-evergreen:log');

debugLog.log = console.log.bind(console);

// This function calls itself recursively. On the first iteration, it collects the data of the main program, during the
// second iteration, it collects the data from all direct dependencies, then it collects their dependencies and so on.
// Now includes single-pass filtering to eliminate multiple iterations over the data.
const recursivelyCollectAllDependencies = async (options: any) => {
	const { color: colorize, deps: currentExtendedPackageJson, unknown } = options;
	const moduleInfo: ModuleInfo = { ...INITIAL_MODULE_INFO };
	const currentPackageNameAndVersion = `${currentExtendedPackageJson.name}@${currentExtendedPackageJson.version}`;

	let { data } = options;
	let licenseFilesInCurrentModuleDirectory: string[] = [];
	let licenseData;
	let licenseFile;
	let noticeFiles: string[] = [];
	const clarification = options.clarifications[currentExtendedPackageJson.name]?.find(
		(clarification: any) =>
			currentExtendedPackageJson.version === clarification.semverRange ||
			semver.satisfies(currentExtendedPackageJson.version, clarification.semverRange),
	);
	let passedClarificationCheck = clarification?.checksum ? false : true;
	if (clarification) {
		clarification.used = true;
	}

	if (
		// If we have processed this currentPackageNameAndVersion already, just return the data object.
		// This was added so that we don't recurse forever if there was a circular
		// dependency in the dependency tree.
		data[currentPackageNameAndVersion] ||
		(options.production && currentExtendedPackageJson.extraneous) ||
		(options.development && !currentExtendedPackageJson.extraneous && !currentExtendedPackageJson.root)
	) {
		return data;
	}

	if (currentExtendedPackageJson.private) {
		moduleInfo.private = true;
	}

	// Apply single-pass filtering if pipeline is provided
	if (options.filterPipeline) {
		const filteredData = options.filterPipeline.processPackage(currentPackageNameAndVersion, moduleInfo);
		if (filteredData) {
			data[currentPackageNameAndVersion] = filteredData;
		}
		// If filtered out, don't add to data
	} else {
		data[currentPackageNameAndVersion] = moduleInfo;
	}

	// Include property in output unless custom format has set property explicitly to false:
	const mustInclude = (propertyName = '') => options?.customFormat?.[propertyName] !== false;

	if (mustInclude('repository')) {
		const repositoryUrl = helpers.getRepositoryUrl({
			clarificationRepository: clarification?.repository,
			jsonRepository: currentExtendedPackageJson?.repository,
		});

		if (repositoryUrl) {
			moduleInfo.repository = repositoryUrl;
		}
	}

	if (mustInclude('url')) {
		// TODO: Figure out where the check for currentExtendedPackageJson.url.web comes from. It's in the original license-checker,
		//       but I can't find any documentation on it.
		let url = helpers.getFirstNotUndefinedOrUndefined(
			clarification?.url,
			(currentExtendedPackageJson as any)?.url?.web,
		);
		/*istanbul ignore next*/
		if (url) {
			moduleInfo.url = url;
		}
	}

	if (typeof currentExtendedPackageJson.author === 'object') {
		const { publisher, email, url } = helpers.getAuthorDetails({
			clarification,
			author: currentExtendedPackageJson?.author,
		});

		if (mustInclude('publisher') && publisher) {
			moduleInfo.publisher = publisher;
		}

		if (mustInclude('email') && email) {
			moduleInfo.email = email;
		}

		// moduleInfo.url can for some reason already be set to currentExtendedPackageJson.url.web further up in the code,
		// so we only set it if it's not already set.
		if (typeof moduleInfo.url !== 'undefined' && mustInclude('url') && url) {
			moduleInfo.url = url;
		}
	}

	/*istanbul ignore next*/
	if (unknown) {
		moduleInfo.dependencyPath = currentExtendedPackageJson.path;
	}

	const modulePath = helpers.getFirstNotUndefinedOrUndefined(clarification?.path, currentExtendedPackageJson?.path);
	if (mustInclude('path') && typeof modulePath === 'string') {
		moduleInfo.path = modulePath;
	}

	// Eventually store the contents of the module's README.md in currentExtendedPackageJson.readme:
	helpers.storeReadmeInJsonIfExists(modulePath, currentExtendedPackageJson);

	// console.log('licenseData: %s', licenseData);

	// Try to get the license information from the clarification file or from the package.json file:
	licenseData = helpers.getFirstNotUndefinedOrUndefined(
		clarification?.licenses,
		(currentExtendedPackageJson as any).license,
		(currentExtendedPackageJson as any).licenses,
	);

	if (licenseData) {
		// License information has been collected from either the clarification file or from the package.json file
		const licensesList: string[] = Array.isArray(moduleInfo.licenses) ? moduleInfo.licenses : [moduleInfo.licenses];

		if (licensesList.length > 0) {
			if (Array.isArray(licenseData)) {
				moduleInfo.licenses = licenseData.map((moduleLicense: any) => {
					const moduleLicenseTypeOrName = helpers.getFirstNotUndefinedOrUndefined(
						moduleLicense.type,
						moduleLicense.name,
					);

					if (typeof moduleLicenseTypeOrName === 'string') {
						return moduleLicenseTypeOrName;
					}

					if (typeof moduleLicense === 'string') {
						return moduleLicense;
					}
					
					return 'UNKNOWN';
				}).filter((license): license is string => typeof license === 'string');
			} else {
				// licenseData is a single license, not an array
				const moduleLicenseTypeOrName = helpers.getFirstNotUndefinedOrUndefined(
					(licenseData as any).type,
					(licenseData as any).name,
				);

				if (typeof moduleLicenseTypeOrName === 'string') {
					moduleInfo.licenses = [moduleLicenseTypeOrName];
				} else if (typeof licenseData === 'string') {
					moduleInfo.licenses = [licenseData];
				}
			}
		} else if (
			typeof helpers.getFirstNotUndefinedOrUndefined((licenseData as any).type, (licenseData as any).name) ===
			'string'
		) {
			// @ts-ignore - getLicenseTitle function expects correct types but we're handling dynamic license data
			moduleInfo.licenses = getLicenseTitle(
				helpers.getFirstNotUndefinedOrUndefined((licenseData as any).type, (licenseData as any).name) as string,
			);
		} else if (typeof licenseData === 'string') {
			moduleInfo.licenses = getLicenseTitle(licenseData) || LICENSE_TITLE_UNKNOWN;
		}
	} else if (getLicenseTitle((currentExtendedPackageJson as any).readme)) {
		// Try to get the license information from the README file if neither the clarification file nor the package.json
		// file contained any license information:
		moduleInfo.licenses = getLicenseTitle((currentExtendedPackageJson as any).readme) || LICENSE_TITLE_UNKNOWN;
	}

	if (Array.isArray(moduleInfo.licenses)) {
		/*istanbul ignore else*/
		if (moduleInfo.licenses.length === 1) {
			moduleInfo.licenses = moduleInfo.licenses[0];
		}
	}

	/*istanbul ignore else*/
	if (clarification?.licenseFile) {
		licenseFilesInCurrentModuleDirectory = [clarification.licenseFile];
	} else if (await licenseFileCache.fileExistsAsync(modulePath)) {
		try {
			const filesInModuleDirectory = await fsPromises.readdir(modulePath);
			licenseFilesInCurrentModuleDirectory = licenseFiles(filesInModuleDirectory);

			noticeFiles = filesInModuleDirectory.filter((filename) => {
				filename = filename.toUpperCase();
				const name = path.basename(filename).replace(path.extname(filename), '');

				return name === 'NOTICE';
			});
		} catch {
			// If directory read fails, continue with empty arrays
			licenseFilesInCurrentModuleDirectory = [];
			noticeFiles = [];
		}
	}

	// console.log('licenseFilesInCurrentModuleDirectory before: %s', licenseFilesInCurrentModuleDirectory);

	for (let index = 0; index < licenseFilesInCurrentModuleDirectory.length; index++) {
		const filename = licenseFilesInCurrentModuleDirectory[index];
		licenseFile = path.join(modulePath, filename);

		// Check if file exists asynchronously
		if (await licenseFileCache.fileExistsAsync(licenseFile)) {
			let licenseFileData: { content: string; checksum?: string } | null = null;

			if (
				!moduleInfo.licenses ||
				moduleInfo.licenses.indexOf(LICENSE_TITLE_UNKNOWN) > -1
				// TODO: Should we override a custom license?
				// || moduleInfo.licenses.indexOf('Custom:') === 0
			) {
				//Only re-check the license if we didn't get it from elsewhere
				licenseFileData = await licenseFileCache.readLicenseFileAsync(licenseFile, false);
				moduleInfo.licenses = getLicenseTitle(licenseFileData.content) || LICENSE_TITLE_UNKNOWN;
			}

			if (index === 0) {
				// Treat the file with the highest precedence as licenseFile
				if (clarification !== undefined && !passedClarificationCheck) {
					/*istanbul ignore else*/
					if (!licenseFileData) {
						licenseFileData = await licenseFileCache.readLicenseFileAsync(licenseFile, true);
					} else if (!licenseFileData.checksum) {
						// Need checksum for verification
						licenseFileData = await licenseFileCache.readLicenseFileAsync(licenseFile, true);
					}

					if (clarification.checksum !== licenseFileData.checksum) {
						console.error(
							`Clarification checksum mismatch for ${currentPackageNameAndVersion} :(\nFile checked: ${licenseFile}`,
						);
						process.exit(1);
					} else {
						passedClarificationCheck = true;
					}
				}

				/*istanbul ignore else*/
				if (mustInclude('licenseFile')) {
					moduleInfo.licenseFile = helpers.getFirstNotUndefinedOrUndefined(
						clarification?.licenseFile,
						options.basePath ? path.relative(options.basePath, licenseFile) : licenseFile,
					) as string;
				}

				if (mustInclude('licenseText') && options.customFormat) {
					if (clarification?.licenseText) {
						moduleInfo.licenseText = clarification.licenseText;
					} else {
						if (!licenseFileData) {
							licenseFileData = await licenseFileCache.readLicenseFileAsync(licenseFile, false);
						}

						/*istanbul ignore else*/
						if (options._args && !options._args.csv) {
							moduleInfo.licenseText = licenseFileData.content.trim();
						} else {
							moduleInfo.licenseText = licenseFileData.content
								.replace(/"/g, "'")
								.replace(/\r?\n|\r/g, ' ')
								.trim();
						}
					}

					if (clarification?.licenseStart) {
						// @ts-ignore - licenseText may be undefined but we handle this case with clarification
						let startIndex = moduleInfo.licenseText.indexOf(clarification.licenseStart);
						let endIndex;

						if (clarification?.licenseEnd) {
							// @ts-ignore - licenseText may be undefined but we handle this case with clarification
							endIndex = moduleInfo.licenseText.indexOf(clarification.licenseEnd, startIndex);
						} else {
							// @ts-ignore - licenseText may be undefined but we handle this case with clarification
							endIndex = moduleInfo.licenseText.length;
						}
						// @ts-ignore - licenseText may be undefined but we handle this case with clarification
						moduleInfo.licenseText = moduleInfo.licenseText.substring(startIndex, endIndex);
					}
				}

				if (mustInclude('copyright') && options.customFormat) {
					if (clarification?.copyright) {
						moduleInfo.copyright = clarification.copyright;
					} else {
						if (!licenseFileData) {
							licenseFileData = await licenseFileCache.readLicenseFileAsync(licenseFile, false);
						}

						const linesWithCopyright = helpers.getLinesWithCopyright(licenseFileData.content);

						if (linesWithCopyright.length > 0) {
							moduleInfo.copyright = linesWithCopyright[0].replace(/\n/g, '. ').trim();
						}

						// Mark files with multiple copyright statements. This might be
						// an indicator to take a closer look at the LICENSE file.
						if (linesWithCopyright.length > 1) {
							moduleInfo.copyright = `${moduleInfo.copyright}*`;
						}
					}
				}
			}
		}
	}

	// console.log('moduleInfo.licenses after: %s', moduleInfo.licenses);

	if (!passedClarificationCheck) {
		console.error('All clarifications must come with a checksum');
		process.exit(1);
	}

	// TODO: How do clarifications interact with notice files?
	for (const filename of noticeFiles) {
		const file = path.join(currentExtendedPackageJson.path, filename);
		try {
			const stat = await fsPromises.lstat(file);
			if (stat.isFile()) {
				moduleInfo.noticeFile = options.basePath ? path.relative(options.basePath, file) : file;
				break; // Only use the first notice file found
			}
		} catch {
			// Skip files that can't be accessed
			continue;
		}
	}

	/*istanbul ignore else*/
	if (currentExtendedPackageJson.dependencies) {
		for (const dependencyName of Object.keys(currentExtendedPackageJson.dependencies)) {
			const childDependency =
				options.currentRecursionDepth > options._args.direct
					? {}
					: currentExtendedPackageJson.dependencies[dependencyName];

			// Handle case where childDependency is a version string instead of an object
			if (typeof childDependency === 'string') {
				// Skip string dependencies as they don't have the expanded structure needed
				continue;
			}

			const dependencyId = `${childDependency.name}@${childDependency.version}`;

			if (data[dependencyId]) {
				// already exists
				continue;
			}

			data = await recursivelyCollectAllDependencies({
				_args: options._args,
				basePath: options.basePath,
				color: colorize,
				customFormat: options.customFormat,
				data,
				deps: childDependency,
				development: options.development,
				production: options.production,
				unknown,
				currentRecursionDepth: options.currentRecursionDepth + 1,
				clarifications: options.clarifications,
			});
		}
	}

	if (!currentExtendedPackageJson.name || !currentExtendedPackageJson.version) {
		delete data[currentPackageNameAndVersion];
	}

	/*istanbul ignore next*/
	if (options.customFormat) {
		Object.keys(options.customFormat).forEach((customFormatKey) => {
			if (mustInclude(customFormatKey) && moduleInfo[customFormatKey] === undefined) {
				moduleInfo[customFormatKey] = helpers.getFirstNotUndefinedOrUndefined(
					clarification?.[customFormatKey],
					typeof currentExtendedPackageJson[customFormatKey] === 'string'
						? currentExtendedPackageJson[customFormatKey]
						: options.customFormat[customFormatKey],
				);
			}
		});
	}

	return data;
};

const initOptimized = async (args: any, callback: (error: Error | null, result?: any) => void) => {
	debugLog('scanning %s (optimized single-pass)', args.start);

	// customPath is a path to a JSON file that defined a custom format
	if (args.customPath) {
		args.customFormat = parseJson(args.customPath);
	}

	const optionsForReadingInstalledPackages = {
		depth: args.direct, // How deep to traverse the dependency tree
		nopeer: args.nopeer, // Whether or not to skip peerDependencies in output
		dev: true, // Whether or not to include devDependencies
		log: debugLog, // A function to log debug info
	};

	if (args.production || args.development) {
		optionsForReadingInstalledPackages.dev = false;
	}

	// Parse filtering options
	const excludeLicenses =
		args.excludeLicenses &&
		args.excludeLicenses
			.match(/([^\\\][^,]|\\,)+/g)
			?.map((license: string) => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));

	const includeLicenses =
		args.includeLicenses &&
		args.includeLicenses
			.match(/([^\\\][^,]|\\,)+/g)
			?.map((license: string) => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));

	// Create filtering pipeline
	const filterPipeline = new FilteringPipeline({
		excludeLicenses,
		includeLicenses,
		includePackages: helpers.getOptionArray(args.includePackages),
		excludePackages: helpers.getOptionArray(args.excludePackages),
		excludePackagesStartingWith: helpers.getOptionArray(args.excludePackagesStartingWith),
		excludePrivatePackages: args.excludePrivatePackages,
		onlyunknown: args.onlyunknown,
		failOn: args.failOn
			?.split(';')
			.map((s: string) => s.trim())
			.filter(Boolean),
		onlyAllow: args.onlyAllow
			?.split(';')
			.map((s: string) => s.trim())
			.filter(Boolean),
		colorize: args.color,
		relativeModulePath: args.relativeModulePath,
		startPath: args.start,
	});

	// Clarifications processing (same as original)
	let clarifications: { [key: string]: any } = {};
	if (args.clarificationsFile) {
		const clarificationsFromFile = parseJson(args.clarificationsFile);

		for (const [versionString, clarification] of Object.entries(clarificationsFromFile)) {
			const versionSplit = versionString.lastIndexOf('@');
			if (versionSplit !== -1) {
				const name = versionString.slice(0, versionSplit);
				const semverRange = versionString.slice(versionSplit + 1);
				clarifications[name] = clarifications[name] || [];
				clarifications[name].push({ ...(clarification as any), semverRange, used: false });
			}
		}
	}

	try {
		// Use promisified version of readInstalledPackages
		const installedPackagesJson = await new Promise<any>((resolve, reject) => {
			readInstalledPackagesSafe(args.start, optionsForReadingInstalledPackages, (err: any, result: any) => {
				if (err) reject(err);
				else resolve(result);
			});
		});

		if (optionsForReadingInstalledPackages.depth === 0) {
			helpers.deleteNonDirectDependenciesFromAllDependencies(installedPackagesJson, args);
		}

		// Single-pass collection with filtering
		const allFilteredDependencies = await recursivelyCollectAllDependencies({
			_args: args,
			basePath: args.relativeLicensePath ? (installedPackagesJson as any).path : null,
			color: args.color,
			customFormat: args.customFormat,
			data: {},
			deps: installedPackagesJson,
			development: args.development,
			production: args.production,
			unknown: args.unknown,
			currentRecursionDepth: 0,
			clarifications,
			filterPipeline, // Pass the filtering pipeline
		});

		// Check clarifications usage if needed
		if (args.clarificationsMatchAll) {
			const unusedClarifications: string[] = [];
			for (const [packageName, entries] of Object.entries(clarifications)) {
				for (const clarification of entries as any[]) {
					if (!clarification.used) {
						unusedClarifications.push(`${packageName}@${clarification.semverRange}`);
					}
				}
			}
			if (unusedClarifications.length) {
				console.error(
					`Some clarifications (${unusedClarifications.join(
						', ',
					)}) were unused and --clarificationsMatchAll was specified. Exiting.`,
				);
				process.exit(1);
			}
		}

		// Data is already filtered and sorted by name during collection
		const sortedData = Object.keys(allFilteredDependencies)
			.sort()
			.reduce((result: any, key: string) => {
				result[key] = allFilteredDependencies[key];
				return result;
			}, {});

		if (!Object.keys(sortedData).length) {
			throw new Error('No packages found in this path...');
		}

		// Output to files if necessary
		await writeOutput(args, sortedData);

		// Log performance statistics
		const cacheStats = licenseFileCache.getStats();
		const filterStats = filterPipeline.getStats();
		debugLog('License file cache stats: %o', cacheStats);
		debugLog('Filtering pipeline stats: %o', filterStats);

		callback(null, sortedData);
	} catch (error) {
		debugError(error);
		callback(error as Error);
	}
};

const initMemoryOptimized = async (args: any, callback: (error: Error | null, result?: any) => void) => {
	debugLog('scanning %s (memory-optimized)', args.start);

	// Create memory-efficient package collection
	const packageCollection = new PackageCollection(licenseFileCache);

	// customPath is a path to a JSON file that defined a custom format
	if (args.customPath) {
		args.customFormat = parseJson(args.customPath);
	}

	const optionsForReadingInstalledPackages = {
		depth: args.direct, // How deep to traverse the dependency tree
		nopeer: args.nopeer, // Whether or not to skip peerDependencies in output
		dev: true, // Whether or not to include devDependencies
		log: debugLog, // A function to log debug info
	};

	if (args.production || args.development) {
		optionsForReadingInstalledPackages.dev = false;
	}

	// Parse filtering options
	const excludeLicenses =
		args.excludeLicenses &&
		args.excludeLicenses
			.match(/([^\\\][^,]|\\,)+/g)
			?.map((license: string) => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));

	const includeLicenses =
		args.includeLicenses &&
		args.includeLicenses
			.match(/([^\\\][^,]|\\,)+/g)
			?.map((license: string) => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));

	// Create filtering pipeline
	const filterPipeline = new FilteringPipeline({
		excludeLicenses,
		includeLicenses,
		includePackages: helpers.getOptionArray(args.includePackages),
		excludePackages: helpers.getOptionArray(args.excludePackages),
		excludePackagesStartingWith: helpers.getOptionArray(args.excludePackagesStartingWith),
		excludePrivatePackages: args.excludePrivatePackages,
		onlyunknown: args.onlyunknown,
		failOn: args.failOn
			?.split(';')
			.map((s: string) => s.trim())
			.filter(Boolean),
		onlyAllow: args.onlyAllow
			?.split(';')
			.map((s: string) => s.trim())
			.filter(Boolean),
		colorize: args.color,
		relativeModulePath: args.relativeModulePath,
		startPath: args.start,
	});

	// Clarifications processing (same as original)
	let clarifications: { [key: string]: any } = {};
	if (args.clarificationsFile) {
		const clarificationsFromFile = parseJson(args.clarificationsFile);

		for (const [versionString, clarification] of Object.entries(clarificationsFromFile)) {
			const versionSplit = versionString.lastIndexOf('@');
			if (versionSplit !== -1) {
				const name = versionString.slice(0, versionSplit);
				const semverRange = versionString.slice(versionSplit + 1);
				clarifications[name] = clarifications[name] || [];
				clarifications[name].push({ ...(clarification as any), semverRange, used: false });
			}
		}
	}

	try {
		// Use promisified version of readInstalledPackages
		const installedPackagesJson = await new Promise<any>((resolve, reject) => {
			readInstalledPackagesSafe(args.start, optionsForReadingInstalledPackages, (err: any, result: any) => {
				if (err) reject(err);
				else resolve(result);
			});
		});

		if (optionsForReadingInstalledPackages.depth === 0) {
			helpers.deleteNonDirectDependenciesFromAllDependencies(installedPackagesJson, args);
		}

		// Memory-efficient collection with streaming
		const allFilteredDependencies = await recursivelyCollectAllDependenciesMemoryOptimized({
			_args: args,
			basePath: args.relativeLicensePath ? (installedPackagesJson as any).path : null,
			color: args.color,
			customFormat: args.customFormat,
			packageCollection,
			deps: installedPackagesJson,
			development: args.development,
			production: args.production,
			unknown: args.unknown,
			currentRecursionDepth: 0,
			clarifications,
			filterPipeline, // Pass the filtering pipeline
		});

		// Check clarifications usage if needed
		if (args.clarificationsMatchAll) {
			const unusedClarifications: string[] = [];
			for (const [packageName, entries] of Object.entries(clarifications)) {
				for (const clarification of entries as any[]) {
					if (!clarification.used) {
						unusedClarifications.push(`${packageName}@${clarification.semverRange}`);
					}
				}
			}
			if (unusedClarifications.length) {
				console.error(
					`Some clarifications (${unusedClarifications.join(
						', ',
					)}) were unused and --clarificationsMatchAll was specified. Exiting.`,
				);
				process.exit(1);
			}
		}

		// Data is already filtered and sorted by name during collection
		const sortedData = Object.keys(allFilteredDependencies)
			.sort()
			.reduce((result: any, key: string) => {
				result[key] = allFilteredDependencies[key];
				return result;
			}, {});

		if (!Object.keys(sortedData).length) {
			throw new Error('No packages found in this path...');
		}

		// Output to files if necessary
		await writeOutput(args, sortedData);

		// Log performance statistics
		const cacheStats = licenseFileCache.getStats();
		const filterStats = filterPipeline.getStats();
		const collectionStats = packageCollection.getStats();
		const memoryInfo = packageCollection.getMemoryInfo();
		debugLog('License file cache stats: %o', cacheStats);
		debugLog('Filtering pipeline stats: %o', filterStats);
		debugLog('Package collection stats: %o', collectionStats);
		debugLog('Memory usage info: %o', memoryInfo);

		// Cleanup memory
		packageCollection.cleanup();

		callback(null, sortedData);
	} catch (error) {
		debugError(error);
		callback(error as Error);
	}
};

const init = (args: any, callback: (error: Error | null, result?: any) => void) => {
	debugLog('scanning %s', args.start);

	// customPath is a path to a JSON file that defined a custom format
	if (args.customPath) {
		args.customFormat = parseJson(args.customPath);
	}

	const optionsForReadingInstalledPackages = {
		depth: args.direct, // How deep to traverse the dependency tree
		nopeer: args.nopeer, // Whether or not to skip peerDependencies in output
		dev: true, // Whether or not to include devDependencies
		log: debugLog, // A function to log debug info
	};

	if (args.production || args.development) {
		optionsForReadingInstalledPackages.dev = false;
	}

	const toCheckforFailOn: string[] = [];
	const toCheckforOnlyAllow: string[] = [];
	let checker;
	let pusher;

	if (args.onlyAllow) {
		checker = args.onlyAllow;
		pusher = toCheckforOnlyAllow;
	}

	if (args.failOn) {
		checker = args.failOn;
		pusher = toCheckforFailOn;
	}

	// An object mapping from Package name -> list of what contents it should have, including a semver range for each entry
	let clarifications: { [key: string]: any } = {};
	if (args.clarificationsFile) {
		const clarificationsFromFile = parseJson(args.clarificationsFile);

		for (const [versionString, clarification] of Object.entries(clarificationsFromFile)) {
			const versionSplit = versionString.lastIndexOf('@');
			if (versionSplit !== -1) {
				const name = versionString.slice(0, versionSplit);
				const semverRange = versionString.slice(versionSplit + 1);
				clarifications[name] = clarifications[name] || [];
				// keep track for each clarification if it was used, optionally error when not
				clarifications[name].push({ ...(clarification as any), semverRange, used: false });
			}
		}
	}

	if (checker && pusher) {
		checker.split(';').forEach((license: string) => {
			license = license.trim();
			/*istanbul ignore else*/
			if (license.length > 0) {
				pusher.push(license);
			}
		});
	}

	readInstalledPackagesSafe(
		args.start,
		optionsForReadingInstalledPackages,
		async (err: any, installedPackagesJson: any) => {
			// Good to know:
			// The json object returned by readInstalledPackages stores all direct (prod and dev) dependencies from
			// the package.json file in the property '_dependencies'. The property 'dependencies' contains all dependencies,
			// including the ones that are only required by other dependencies.
			if (optionsForReadingInstalledPackages.depth === 0) {
				helpers.deleteNonDirectDependenciesFromAllDependencies(installedPackagesJson, args);
			}

			// 'allWantedDepthDependenciesWithVersions' might be longer than 'installedPackagesJson.dependencies', as it appends the version numbers to each key (package name),
			// e.g. 'grunt@1' instead of 'grunt', and this way contains all different installed versions of each package:
			let allWantedDepthDependenciesWithVersions = await recursivelyCollectAllDependencies({
				_args: args,
				basePath: args.relativeLicensePath ? installedPackagesJson.path : null,
				color: args.color,
				customFormat: args.customFormat,
				data: {},
				deps: installedPackagesJson,
				development: args.development,
				production: args.production,
				unknown: args.unknown,
				currentRecursionDepth: 0,
				clarifications,
			});

			if (args.clarificationsMatchAll) {
				const unusedClarifications: string[] = [];
				for (const [packageName, entries] of Object.entries(clarifications)) {
					for (const clarification of entries as any[]) {
						if (!clarification.used) {
							unusedClarifications.push(`${packageName}@${clarification.semverRange}`);
						}
					}
				}
				if (unusedClarifications.length) {
					console.error(
						`Some clarifications (${unusedClarifications.join(
							', ',
						)}) were unused and --clarificationsMatchAll was specified. Exiting.`,
					);

					process.exit(1);
				}
			}

			const colorize = args.color;
			const sorted = {}; // 'sorted' will store the same items as allWantedDepthDependenciesWithVersions, but sorted by package name and version
			let resultJson = {};
			const excludeLicenses =
				args.excludeLicenses &&
				args.excludeLicenses
					.match(/([^\\\][^,]|\\,)+/g)
					.map((license: string) => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));
			const includeLicenses =
				args.includeLicenses &&
				args.includeLicenses
					.match(/([^\\\][^,]|\\,)+/g)
					.map((license: string) => license.replace(/\\,/g, ',').replace(/^\s+|\s+$/g, ''));
			let inputError = null;

			const colorizeString = (string: string) =>
				/*istanbul ignore next*/
				colorize ? chalk.bold.red(string) : string;

			const filterDeletePrivatePackages = (privatePackage) => {
				/*istanbul ignore next - I don't have access to private packages to test */
				if (resultJson[privatePackage] && resultJson[privatePackage].private) {
					delete resultJson[privatePackage];
				}
			};

			const onlyIncludeWhitelist = (whitelist, filtered) => {
				const resultJson = {};

				Object.keys(filtered).map((filteredPackage) => {
					// Whitelist packages by declaring:
					// 1. the package full name. Ex: `react` (we suffix an '@' to ensure we don't match packages like `react-native`)
					// 2. the package full name and the major version. Ex: `react@16`
					// 3. the package full name and full version. Ex: `react@16.0.2`
					if (
						whitelist.findIndex((whitelistPackage) =>
							filteredPackage.startsWith(
								whitelistPackage.lastIndexOf('@') > 0 ? whitelistPackage : `${whitelistPackage}@`,
							),
						) !== -1
					) {
						resultJson[filteredPackage] = filtered[filteredPackage];
					}
				});

				return resultJson;
			};

			const excludeBlacklist = (blacklist, filtered) => {
				const resultJson = {};

				Object.keys(filtered).map((filteredPackage) => {
					// Blacklist packages by declaring:
					// 1. the package full name. Ex: `react` (we suffix an '@' to ensure we don't match packages like `react-native`)
					// 2. the package full name and the major version. Ex: `react@16`
					// 3. the package full name and full version. Ex: `react@16.0.2`
					if (
						blacklist.findIndex((blacklistPackage) =>
							filteredPackage.startsWith(
								blacklistPackage.lastIndexOf('@') > 0 ? blacklistPackage : `${blacklistPackage}@`,
							),
						) === -1
					) {
						resultJson[filteredPackage] = filtered[filteredPackage];
					}
				});

				return resultJson;
			};

			const excludePackagesStartingWith = (blacklist, currentResult) => {
				const resultJson = { ...currentResult };

				for (const pkgName in resultJson) {
					for (const denyPrefix of blacklist) {
						if (pkgName.startsWith(denyPrefix)) delete resultJson[pkgName];
					}
				}

				return resultJson;
			};

			const exitIfCheckHits = (packageName) => {
				const currentLicense = resultJson[packageName]?.licenses;

				if (currentLicense) {
					checkForFailOn(currentLicense);
					checkForOnlyAllow(currentLicense, packageName);
				}
			};

			const checkForFailOn = (currentLicense) => {
				if (!Array.isArray(toCheckforFailOn) || toCheckforFailOn.length === 0) {
					return;
				}

				if (toCheckforFailOn.includes(currentLicense)) {
					console.error(`Found license defined by the --failOn flag: "${currentLicense}". Exiting.`);

					process.exit(1);
				}
			};

			/**
			 * Check if the current license contains (eventually among others) at least one of the allowed licenses
			 *
			 * @param      {string}  currentLicense  The current license
			 * @param      {string}  packageName     The package name
			 */
			const checkForOnlyAllow = (currentLicense, packageName) => {
				if (toCheckforOnlyAllow.length > 0) {
					let containsOneOfAllowedPackages = false;

					for (const allowedLicense of toCheckforOnlyAllow) {
						// "currentLicense" is a longer string that may contain several license names,
						// and we check if one of those is a license listed in the "toCheckforOnlyAllow"
						// licenses array:
						if (currentLicense.includes(allowedLicense)) {
							containsOneOfAllowedPackages = true;
							break;
						}
					}

					if (!containsOneOfAllowedPackages) {
						console.error(
							`Package "${packageName}" is licensed under "${currentLicense}" which is not permitted by the --onlyAllow flag. Exiting.`,
						);

						process.exit(1);
					}
				}
			};

			const transformBSD = (spdx) =>
				spdx === 'BSD' ? '(0BSD OR BSD-2-Clause OR BSD-3-Clause OR BSD-4-Clause)' : spdx;

			const invertResultOf = (fn) => (spdx) => !fn(spdx);

			const spdxIsValid = (spdx) => spdxCorrect(spdx) === spdx;

			const getLicenseMatch = (licensesArr, filtered, packageName, packageData, compareLicenses) => {
				const validSPDXLicenses = compareLicenses.map(transformBSD).filter(spdxIsValid);
				const invalidSPDXLicenses = compareLicenses.map(transformBSD).filter(invertResultOf(spdxIsValid));
				const spdxExcluder = `( ${validSPDXLicenses.join(' OR ')} )`;

				let match = false;

				licensesArr.forEach((license) => {
					/*istanbul ignore if - just for protection*/
					if (license.indexOf(LICENSE_TITLE_UNKNOWN) >= 0) {
						// Necessary due to colorization:
						filtered[packageName] = packageData;
					} else {
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
						}
					}
				});

				return match;
			};

			// This following block stores the licenses in the sorted object (before, the sorted object is the empty object):
			Object.keys(allWantedDepthDependenciesWithVersions)
				.sort()
				.forEach((item) => {
					if (allWantedDepthDependenciesWithVersions[item].private) {
						allWantedDepthDependenciesWithVersions[item].licenses =
							colorizeString(LICENSE_TITLE_UNLICENSED);
					}

					/*istanbul ignore next*/
					if (!allWantedDepthDependenciesWithVersions[item].licenses) {
						allWantedDepthDependenciesWithVersions[item].licenses = colorizeString(LICENSE_TITLE_UNKNOWN);
					}

					if (
						args.unknown &&
						allWantedDepthDependenciesWithVersions[item].licenses &&
						allWantedDepthDependenciesWithVersions[item].licenses !== LICENSE_TITLE_UNKNOWN &&
						allWantedDepthDependenciesWithVersions[item].licenses.indexOf('*') > -1
					) {
						/*istanbul ignore if*/
						allWantedDepthDependenciesWithVersions[item].licenses = colorizeString(LICENSE_TITLE_UNKNOWN);
					}
					/*istanbul ignore else*/
					if (allWantedDepthDependenciesWithVersions[item]) {
						if (args.relativeModulePath && allWantedDepthDependenciesWithVersions[item].path != null) {
							allWantedDepthDependenciesWithVersions[item].path = path.relative(
								args.start,
								allWantedDepthDependenciesWithVersions[item].path,
							);
						}

						if (args.onlyunknown) {
							if (
								allWantedDepthDependenciesWithVersions[item].licenses.indexOf('*') > -1 ||
								allWantedDepthDependenciesWithVersions[item].licenses.indexOf(LICENSE_TITLE_UNKNOWN) >
									-1
							) {
								sorted[item] = allWantedDepthDependenciesWithVersions[item];
							}
						} else {
							sorted[item] = allWantedDepthDependenciesWithVersions[item];
						}
					}
				});

			// 'allWantedDepthDependenciesWithVersions' is not needed anymore:
			allWantedDepthDependenciesWithVersions = null;

			if (!Object.keys(sorted).length) {
				err = new Error('No packages found in this path...');
			}

			// This following block stores the entries from the 'sorted' object in the
			// resultJson object (before, the resultJson object is the empty object):
			if (
				(!Array.isArray(excludeLicenses) || excludeLicenses.length === 0) &&
				(!Array.isArray(includeLicenses) || includeLicenses.length === 0)
			) {
				resultJson = { ...sorted };
			} else {
				if (Array.isArray(excludeLicenses) && excludeLicenses.length > 0) {
					Object.entries(sorted).forEach(([packageName, packageData]) => {
						let { licenses } = packageData;

						/*istanbul ignore if - just for protection*/
						if (!licenses) {
							resultJson[packageName] = packageData;
						} else {
							const licensesArr = Array.isArray(licenses) ? licenses : [licenses];
							const licenseMatch = getLicenseMatch(
								licensesArr,
								resultJson,
								packageName,
								packageData,
								excludeLicenses,
							);

							if (!licenseMatch) {
								resultJson[packageName] = packageData;
							}
						}
					});
				}

				if (Array.isArray(includeLicenses) && includeLicenses.length > 0) {
					Object.entries(sorted).forEach(([packageName, packageData]) => {
						let { licenses } = packageData;

						/*istanbul ignore if - just for protection*/
						if (!licenses) {
							resultJson[packageName] = packageData;
						} else {
							const licensesArr = Array.isArray(licenses) ? licenses : [licenses];
							const licenseMatch = getLicenseMatch(
								licensesArr,
								resultJson,
								packageName,
								packageData,
								includeLicenses,
							);

							if (licenseMatch) {
								resultJson[packageName] = packageData;
							}
						}
					});
				}
			}

			// package whitelist
			const whitelist = helpers.getOptionArray(args.includePackages);
			if (whitelist) {
				resultJson = onlyIncludeWhitelist(whitelist, resultJson);
			}

			// package blacklist
			const blacklist = helpers.getOptionArray(args.excludePackages);
			if (blacklist) {
				resultJson = excludeBlacklist(blacklist, resultJson);
			}

			// exclude by package name starting with a string
			const excludeStartStringsArr = helpers.getOptionArray(args.excludePackagesStartingWith);
			if (excludeStartStringsArr) {
				resultJson = excludePackagesStartingWith(excludeStartStringsArr, resultJson);
			}

			if (args.excludePrivatePackages) {
				Object.keys(resultJson).forEach(filterDeletePrivatePackages);
			}

			Object.keys(resultJson).forEach(exitIfCheckHits);

			/*istanbul ignore next*/
			if (err) {
				debugError(err);
				inputError = err;
			} else {
				// Output to files, if necessary
				await writeOutput(args, resultJson);
			}

			// Log cache performance if debug is enabled
			const cacheStats = licenseFileCache.getStats();
			debugLog('License file cache stats: %o', cacheStats);

			// Return the callback and variables nicely
			callback(inputError, resultJson);
		},
	);
};

const filterAttributes = (attributes: string[], json: any) => {
	let filteredJson = json;

	if (attributes) {
		filteredJson = {};
		attributes.forEach((attribute) => {
			filteredJson[attribute] = json[attribute];
		});
	}

	return filteredJson;
};

const print = (sorted: any) => {
	console.log(asTree(sorted));
};

const asTree = (sorted: any) => treeify.asTree(sorted, true);

const asSummary = (sorted: any) => {
	const licenseCountMap = new global.Map();
	const licenseCountArray = [];
	const sortedLicenseCountObj = {};

	Object.values(sorted).forEach(({ licenses }) => {
		/*istanbul ignore else*/
		if (licenses) {
			licenseCountMap.set(licenses, licenseCountMap.get(licenses) + 1 || 1);
		}
	});

	licenseCountMap.forEach((count, license) => {
		licenseCountArray.push({ license, count });
	});

	/*istanbul ignore next*/
	licenseCountArray
		.sort((a, b) => b.count - a.count)
		.forEach(({ license, count }) => {
			sortedLicenseCountObj[license] = count;
		});

	return treeify.asTree(sortedLicenseCountObj, true);
};

const asCSV = (sorted: any, customFormat: any, csvComponentPrefix: string) => {
	const csvHeaders = helpers.getCsvHeaders(customFormat, csvComponentPrefix);
	const csvDataArr = helpers.getCsvData(sorted, customFormat, csvComponentPrefix);

	return [csvHeaders, ...csvDataArr].join('\n');
};

/**
 * Exports data as markdown (*.md) file which has it's own syntax.
 * @method
 * @param  {JSON} sorted       The sorted JSON data from all packages.
 * @param  {JSON} customFormat The custom format with information about the needed keys.
 * @return {String}            The returning plain text.
 */
const asMarkDown = (sorted: any, customFormat: any) => {
	let text = [];

	if (customFormat && Object.keys(customFormat).length > 0) {
		Object.keys(sorted).forEach((sortedItem) => {
			text.push(`- **[${sortedItem}](${sorted[sortedItem].repository})**`);

			Object.keys(customFormat).forEach((customItem) => {
				text.push(`    - ${customItem}: ${sorted[sortedItem][customItem]}`);
			});
		});
	} else {
		Object.keys(sorted).forEach((key) => {
			const module = sorted[key];
			text.push(`- [${key}](${module.repository}) - ${module.licenses}`);
		});
	}

	return text.join('\n');
};

/**
 * Output data in plain vertical format like Angular CLI does: https://angular.io/3rdpartylicenses.txt
 */
const asPlainVertical = async (sorted: any) => {
	const results = [];
	for (const [moduleName, moduleData] of Object.entries(sorted)) {
		let licenseText = helpers.getModuleNameForLicenseTextHeader(moduleName);

		if (Array.isArray(moduleData.licenses) && moduleData.licenses.length > 0) {
			licenseText += moduleData.licenses.map((moduleLicense: any) => {
				/*istanbul ignore else*/
				if (typeof moduleLicense === 'object') {
					/*istanbul ignore next*/
					return moduleLicense.type || moduleLicense.name;
				}

				/*istanbul ignore next*/
				if (typeof moduleLicense === 'string') {
					return moduleLicense;
				}
			});
		} else if (
			typeof moduleData.licenses === 'object' &&
			((moduleData.licenses as any).type || (moduleData.licenses as any).name)
		) {
			licenseText += getLicenseTitle((moduleData.licenses as any).type || (moduleData.licenses as any).name);
		} else if (typeof moduleData.licenses === 'string') {
			licenseText += getLicenseTitle(moduleData.licenses) || '';
		}

		licenseText += '\n';

		if ((moduleData as any).licenseText) {
			licenseText += (moduleData as any).licenseText;
		} else if (Array.isArray(moduleData.licenseFile) && moduleData.licenseFile.length > 0) {
			licenseText += moduleData.licenseFile.map((moduleLicense: any) => {
				/*istanbul ignore else*/
				if (typeof moduleLicense === 'object') {
					/*istanbul ignore next*/
					return moduleLicense.type || moduleLicense.name;
				}

				if (typeof moduleLicense === 'string') {
					return moduleLicense;
				}
			});
		} else if (
			typeof moduleData.licenseFile === 'object' &&
			((moduleData.licenseFile as any).type || (moduleData.licenseFile as any).name)
		) {
			licenseText += (moduleData.licenseFile as any).type || (moduleData.licenseFile as any).name;
		} else if (typeof moduleData.licenseFile === 'string') {
			const licenseFileData = await licenseFileCache.readLicenseFileAsync(moduleData.licenseFile, false);
			licenseText += licenseFileData.content;
		}

		results.push(licenseText);
	}

	return results.join('\n\n');
};

const parseJson = (jsonPath: string) => {
	if (typeof jsonPath !== 'string') {
		return new Error('The path was not specified for the JSON file to parse.');
	}

	try {
		const jsonFileContents = fs.readFileSync(jsonPath, { encoding: 'utf8' });

		return JSON.parse(jsonFileContents);
	} catch (err) {
		return err;
	}
};

const asFiles = async (json: any, outDir: string) => {
	await mkdirp(outDir);

	for (const moduleName of Object.keys(json)) {
		const licenseFile = json[moduleName].licenseFile;

		if (licenseFile && (await licenseFileCache.fileExistsAsync(licenseFile))) {
			const licenseFileData = await licenseFileCache.readLicenseFileAsync(licenseFile, false);
			const outPath = path.join(outDir, `${moduleName}-LICENSE.txt`);
			const baseDir = path.dirname(outPath);

			await mkdirp(baseDir);
			await fsPromises.writeFile(outPath, licenseFileData.content, 'utf8');
		} else {
			console.warn(`No license file found for module '${moduleName}'`);
		}
	}
};

/**
 * Write output to a file, if indicated in parsedArgs.
 */
const writeOutput = async (parsedArgs: any, foundLicensesJson: any) => {
	if (parsedArgs.files || parsedArgs.out) {
		const formattedOutput = await licenseCheckerHelpers.getFormattedOutput(foundLicensesJson, parsedArgs);

		if (parsedArgs.files) {
			await asFiles(foundLicensesJson, parsedArgs.files);
		}

		if (parsedArgs.out) {
			const dir = path.dirname(parsedArgs.out);

			await mkdirp(dir);
			await fsPromises.writeFile(parsedArgs.out, formattedOutput, 'utf8');
		}
	}
};

// New memory-optimized recursive collection function
const recursivelyCollectAllDependenciesMemoryOptimized = async (options: any) => {
	const { packageCollection, deps: currentExtendedPackageJson } = options;

	// Early exit conditions
	if (
		packageCollection.hasPackage(currentExtendedPackageJson.name, currentExtendedPackageJson.version) ||
		(options.production && currentExtendedPackageJson.extraneous) ||
		(options.development && !currentExtendedPackageJson.extraneous && !currentExtendedPackageJson.root)
	) {
		return packageCollection.getAllPackages(options.customFormat?.licenseText);
	}

	// Create package info with lazy evaluation
	const packageInfo = new PackageInfo(
		currentExtendedPackageJson.path,
		currentExtendedPackageJson.realPath || currentExtendedPackageJson.path,
		licenseFileCache,
		options.clarifications,
	);

	// Add to collection
	packageCollection.addPackage(packageInfo);

	// Recursively process dependencies
	if (currentExtendedPackageJson.dependencies) {
		for (const dependencyName of Object.keys(currentExtendedPackageJson.dependencies)) {
			const childDependency =
				options.currentRecursionDepth > options._args.direct
					? {}
					: currentExtendedPackageJson.dependencies[dependencyName];

			// Handle case where childDependency is a version string instead of an object
			if (typeof childDependency === 'string') {
				// Skip string dependencies as they don't have the expanded structure needed
				continue;
			}

			if (!childDependency.name || !childDependency.version) {
				continue;
			}

			await recursivelyCollectAllDependenciesMemoryOptimized({
				...options,
				deps: childDependency,
				currentRecursionDepth: options.currentRecursionDepth + 1,
			});
		}
	}

	// Stream packages with filtering for memory efficiency
	const filteredPackages: any = {};
	for (const packageData of packageCollection.streamFiltered(
		(pkg) =>
			options.filterPipeline
				? options.filterPipeline.processPackage(`${pkg.name}@${pkg.version}`, pkg) !== null
				: true,
		options.customFormat?.licenseText,
	)) {
		filteredPackages[`${packageData.name}@${packageData.version}`] = packageData;
	}

	return filteredPackages;
};

// Export legacy version as default for now (tests compatibility)
export {
	recursivelyCollectAllDependencies,
	recursivelyCollectAllDependenciesMemoryOptimized,
	init, // Use legacy version as default for tests
	initOptimized,
	initMemoryOptimized,
	filterAttributes,
	print,
	asTree,
	asSummary,
	asCSV,
	asMarkDown,
	asPlainVertical,
	parseJson,
	asFiles,
	writeOutput,
};
