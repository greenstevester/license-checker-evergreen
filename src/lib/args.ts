/*
Copyright (c) 2013, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://yuilibrary.com/license/
*/

import nopt from 'nopt';
import chalk from 'chalk';
import path from 'node:path';

interface ParsedArguments {
	clarificationsFile?: string;
	clarificationsMatchAll?: boolean;
	color?: boolean | null;
	csv?: boolean;
	csvComponentPrefix?: string;
	customFormat?: Record<string, unknown>;
	customPath?: string;
	depth?: number;
	development?: boolean;
	direct?: number; // Internal property - stores normalized depth value
	excludeLicenses?: string;
	excludePackages?: string;
	excludePackagesStartingWith?: string;
	excludePrivatePackages?: boolean;
	failOn?: string;
	files?: string;
	help?: boolean;
	includeLicenses?: string;
	includePackages?: string;
	json?: boolean;
	legacy?: boolean; // Use legacy read-installed scanner (slower)
	limitAttributes?: string;
	markdown?: boolean;
	nopeer?: boolean;
	onlyAllow?: string;
	onlyunknownOpts?: boolean;
	out?: string;
	plainVertical?: boolean;
	production?: boolean;
	relativeLicensePath?: boolean;
	relativeModulePath?: boolean;
	start?: string;
	summary?: boolean;
	unknownOpts?: boolean;
	version?: boolean;
	argv?: {
		remain: string[];
		cooked: string[];
		original: string[];
	};
}

// For the format requirements of "knownOptions", see the documentation for nopt: https://www.npmjs.com/package/nopt
const knownOptions = {
	clarificationsFile: path,
	clarificationsMatchAll: Boolean,
	color: Boolean,
	csv: Boolean,
	csvComponentPrefix: String,
	customFormat: {},
	customPath: path,
	depth: Number,
	development: Boolean,
	excludeLicenses: String,
	excludePackages: String,
	excludePackagesStartingWith: String,
	excludePrivatePackages: Boolean,
	failOn: String,
	files: path,
	help: Boolean,
	includeLicenses: String,
	includePackages: String,
	json: Boolean,
	legacy: Boolean,
	limitAttributes: String,
	markdown: Boolean,
	nopeer: Boolean,
	onlyAllow: String,
	onlyunknownOpts: Boolean,
	out: path,
	plainVertical: Boolean,
	production: Boolean,
	relativeLicensePath: Boolean,
	relativeModulePath: Boolean,
	start: String,
	summary: Boolean,
	unknownOpts: Boolean,
	version: Boolean,
};

// For the format requirements of "shortHands", see the documentation for nopt: https://www.npmjs.com/package/nopt
const shortHands = {
	h: ['--help'],
	v: ['--version'],
};

const parseArguments = function parseArguments(args?: string[]): ParsedArguments {
	// nopt is an option parser that returns an object looking like this, if you pass the params '--one --two here there -- --three --four':
	//
	// parsedArguments {
	//   one: true,
	//   two: true,
	//   argv: {
	//     remain: [ 'here', 'there', '--three', '--four' ],
	//     cooked: [ '--one', '--two', 'here', 'there', '--', '--three', '--four' ], // contains the expanded shorthand options
	//     original: [ '--one', '--two', 'here', 'there', '--', '--three', '--four' ]
	//   }
	// }
	const parsedArguments = nopt(knownOptions, shortHands, args) as ParsedArguments;

	delete parsedArguments.argv;

	return parsedArguments;
};

/**
 * Converts the --depth option value to a valid depth number.
 * - If no value provided, returns Infinity (scan all depths)
 * - If a number is provided, returns that number (minimum 0)
 *
 * @param value - The depth value from CLI arguments
 * @returns The normalized depth number
 */
const toDepthNumber = function toDepthNumber(value: number | undefined): number {
	if (value === undefined || value === null) {
		return Infinity;
	}
	return Math.max(0, value);
};

const setDefaultArguments = function setDefaultArguments(parsedArguments: ParsedArguments = {}): ParsedArguments {
	const argumentsWithDefaults = { ...parsedArguments };
	/*istanbul ignore else*/
	if (argumentsWithDefaults.color === null || argumentsWithDefaults.color === undefined) {
		argumentsWithDefaults.color = Boolean(chalk.level > 0);
	}

	if (argumentsWithDefaults.json || argumentsWithDefaults.markdown || argumentsWithDefaults.csv) {
		argumentsWithDefaults.color = false;
	}

	argumentsWithDefaults.start = argumentsWithDefaults.start ?? process.cwd();
	argumentsWithDefaults.relativeLicensePath = Boolean(argumentsWithDefaults.relativeLicensePath);
	argumentsWithDefaults.relativeModulePath = Boolean(argumentsWithDefaults.relativeModulePath);
	// Store normalized depth value in 'direct' for internal use (maintains backward compatibility with internal code)
	argumentsWithDefaults.direct = toDepthNumber(argumentsWithDefaults.depth);

	return argumentsWithDefaults;
};

const getNormalizedArguments = function getNormalizedArguments(args?: string[]): ParsedArguments {
	return setDefaultArguments(parseArguments(args));
};

// Alias for backward compatibility
const parse = getNormalizedArguments;

export { knownOptions, getNormalizedArguments, setDefaultArguments, parseArguments, parse };
export type { ParsedArguments };
