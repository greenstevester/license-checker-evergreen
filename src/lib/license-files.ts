import path from 'node:path';

const BASENAMES_PRECEDENCE: RegExp[] = [
	/^LICENSE$/,
	/^LICENCE$/,
	/^LICENSE\-\w+$/, // e.g. LICENSE-MIT
	/^MIT-LICENSE$/,
	/^COPYING$/,
	/^README$/, // TODO: should we really include README?
];

// Find and list license files in the precedence order
const licenseFiles = (dirFiles: string[]): string[] => {
	const files: string[] = [];

	BASENAMES_PRECEDENCE.forEach((basenamePattern) => {
		dirFiles.some((filename) => {
			const basename = getBaseFileName(filename);

			if (basenamePattern.test(basename)) {
				files.push(filename);

				return true;
			}

			return false;
		});
	});

	return files;
};

const getBaseFileName = (filename: string): string => {
	return path.basename(filename, path.extname(filename)).toUpperCase();
};

export { licenseFiles };