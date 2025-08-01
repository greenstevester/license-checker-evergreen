import fs from 'node:fs';
import path from 'node:path';

/**
 * ! This function has a wanted sideeffect, as it modifies the json object that is passed by reference.
 *
 *  The depth attribute set in the options parameter here - which is defined by setting the `--direct` flag - is of
 *  no use with npm < 3, as the older npm versions flattened all dependencies into one single directory. So in
 *  order to making `--direct` work with older versions of npm, we need to filter out all non-dependencies from
 *  the json result.
 */
// TODO: Add tests for this function
const deleteNonDirectDependenciesFromAllDependencies = function deleteNonDirectDependenciesFromAllDependencies(
	{ _dependencies: directDependencies = {}, dependencies: allDependencies = {}, devDependencies = {} } = {},
	options: any,
) {
	const allDependenciesArray = Object.keys(allDependencies);
	const directDependenciesArray = Object.keys(directDependencies);
	const devDependenciesArray = Object.keys(devDependencies);
	let wantedDependenciesArray = [];

	if (options.production && !options.development) {
		wantedDependenciesArray = directDependenciesArray.filter(
			(directDependency) => !devDependenciesArray.includes(directDependency),
		);
	} else if (!options.production && options.development) {
		wantedDependenciesArray = devDependenciesArray;
	} else {
		wantedDependenciesArray = directDependenciesArray;
	}

	allDependenciesArray.forEach((currentDependency) => {
		if (!wantedDependenciesArray.includes(currentDependency)) {
			// @ts-ignore - Dynamic property deletion on object with any type structure
			delete allDependencies[currentDependency];
		}
	});
};

const getRepositoryUrl = function getRepositoryUrl({
	clarificationRepository,
	jsonRepository,
}: {
	clarificationRepository?: string;
	jsonRepository?: any;
}) {
	if (clarificationRepository) {
		return clarificationRepository;
	}

	if (typeof jsonRepository?.url === 'string') {
		return jsonRepository.url
			.replace('git+ssh://git@', 'git://')
			.replace('git+https://github.com', 'https://github.com')
			.replace('git://github.com', 'https://github.com')
			.replace('git@github.com:', 'https://github.com/')
			.replace(/\.git$/, '');
	}

	return undefined;
};

const getFirstNotUndefinedOrUndefined = function getFirstNotUndefinedOrUndefined(...args: any[]) {
	for (let i = 0; i < args.length; i++) {
		if (typeof args[i] !== 'undefined') {
			return args[i];
		}
	}

	return undefined;
};

const getAuthorDetails = function getAuthorDetails({ clarification, author }: { clarification?: any; author?: any }) {
	let publisher = getFirstNotUndefinedOrUndefined(clarification?.publisher, author?.name) as string;
	let email = getFirstNotUndefinedOrUndefined(clarification?.email, author?.email) as string;
	let url = getFirstNotUndefinedOrUndefined(clarification?.url, author?.url) as string;

	return { publisher, email, url };
};

const getLinesWithCopyright = function getLinesWithCopyright(fileContents = '') {
	return fileContents
		.replace(/\r\n/g, '\n')
		.split('\n\n')
		.filter(function selectCopyRightStatements(value) {
			return (
				value.startsWith('opyright', 1) && // include copyright statements
				!value.startsWith('opyright notice', 1) && // exclude lines from from license text
				!value.startsWith('opyright and related rights', 1)
			);
		})
		.filter(function removeDuplicates(value, index, list) {
			return index === 0 || value !== list[0];
		});
};

const getOptionArray = (option: any): string[] | undefined => {
	if (Array.isArray(option)) {
		return option;
	}

	if (typeof option === 'string') {
		return option.split(';');
	}

	return undefined;
};

const getCsvData = (sorted: any, customFormat: any, csvComponentPrefix: string) => {
	const csvDataArr: string[] = [];

	Object.entries(sorted).forEach(([key, module]: [string, any]) => {
		const dataElements = [];

		if (csvComponentPrefix) {
			dataElements.push(`"${csvComponentPrefix}"`);
		}

		// Grab the custom keys from the custom format
		if (typeof customFormat === 'object' && Object.keys(customFormat).length > 0) {
			dataElements.push(`"${key}"`);

			Object.keys(customFormat).forEach((item) => {
				dataElements.push(`"${(module as any)[item]}"`);
			});
		} else {
			// Be sure to push empty strings for empty values, as this is what CSV expects:
			dataElements.push(`"${key}"`);
			dataElements.push(`"${(module as any).licenses || ''}"`);
			dataElements.push(`"${(module as any).repository || ''}"`);
		}

		csvDataArr.push(dataElements.join(','));
	});

	return csvDataArr;
};

const getCsvHeaders = (customFormat: any, csvComponentPrefix: string) => {
	const prefixName = '"component"';
	const entriesArr = [];

	if (csvComponentPrefix) {
		entriesArr.push(prefixName);
	}

	if (typeof customFormat === 'object' && Object.keys(customFormat).length > 0) {
		entriesArr.push('"module name"');

		Object.keys(customFormat).forEach((item) => {
			entriesArr.push(`"${item}"`);
		});
	} else {
		entriesArr.push('"module name"', '"license"', '"repository"');
	}

	return entriesArr.join(',');
};

const getModuleNameForLicenseTextHeader = (moduleName = '') => {
	const lastIndexOfAtCharacter = moduleName.lastIndexOf('@');

	return `${moduleName.substring(0, lastIndexOfAtCharacter)} ${moduleName.substring(lastIndexOfAtCharacter + 1)}\n`;
};

// Eventually store the contents of the module's README.md in currentExtendedPackageJson.readme:
const storeReadmeInJsonIfExists = (modulePath: string, currentExtendedPackageJson: any) => {
	if (
		typeof modulePath !== 'string' ||
		typeof currentExtendedPackageJson !== 'object' ||
		modulePath === '' ||
		(typeof currentExtendedPackageJson?.readme === 'string' &&
			currentExtendedPackageJson?.readme?.toLowerCase()?.indexOf('no readme data found') === -1)
	) {
		return;
	}

	const readmeFile = path.join(modulePath, 'README.md');

	if (fs.existsSync(readmeFile)) {
		currentExtendedPackageJson.readme = fs.readFileSync(readmeFile, 'utf8').toString();
	}
};

export {
	deleteNonDirectDependenciesFromAllDependencies,
	getAuthorDetails,
	getCsvData,
	getCsvHeaders,
	getFirstNotUndefinedOrUndefined,
	getLinesWithCopyright,
	getModuleNameForLicenseTextHeader,
	getOptionArray,
	getRepositoryUrl,
	storeReadmeInJsonIfExists,
};
