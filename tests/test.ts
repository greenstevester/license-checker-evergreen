import { describe, test, beforeAll, afterAll, expect, it } from '@jest/globals';
import path from 'path';
import util from 'util';
import * as checker from '../dist/lib/index.js';
import * as args from '../dist/lib/args.js';
import chalk from 'chalk';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import assert from 'assert';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);
const pkgPath: string = path.join(__dirname, '../package.json');
const pkgJson: Record<string, any> = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

interface CheckerOptions {
	start: string;
	unknown?: boolean;
	direct?: number;
	customFormat?: Record<string, string>;
	json?: boolean;
	out?: string;
	excludeLicenses?: string;
	includeLicenses?: string;
	onlyAllow?: string;
	failOn?: string;
	development?: boolean;
	relativeModulePath?: boolean;
	relativeLicensePath?: boolean;
	copyright?: string;
	onlyunknown?: boolean;
	production?: boolean;
	includePackages?: string;
	excludePackages?: string;
	excludePackagesStartingWith?: string;
	excludePrivatePackages?: boolean;
}

interface CheckerOutput {
	[key: string]: {
		licenses?: string;
		repository?: string;
		description?: string;
		name?: string;
		pewpew?: string;
		path?: string;
		licenseFile?: string;
		licenseText?: string;
		publisher?: string;
		email?: string;
		copyright?: string;
	};
}

interface TestResult {
	output?: CheckerOutput;
	exitCode?: number;
}

interface CustomFormat {
	name?: string;
	description?: string;
	pewpew?: string;
	publisher?: string;
	copyright?: string;
	email?: boolean;
	licenseFile?: boolean;
	licenseText?: boolean;
}

describe('main tests', (): void => {
	test('should load init', (): void => {
		expect(typeof checker.init).toBe('function');
	});

	test('should load print', (): void => {
		expect(typeof checker.print).toBe('function');
	});

	describe('should parse local with unknown', (): void => {
		let output: CheckerOutput;

		beforeAll((done): void => {
			checker.init(
				{
					start: path.join(__dirname, '../'),
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					output = sorted;
					done();
				}
			);
		}, 10000);

		test('and give us results', (): void => {
			expect(Object.keys(output).length).toBeGreaterThan(70);
			expect(output['abbrev@1.0.9']?.licenses).toBe('ISC');
		});

		test('and convert to CSV', (): void => {
			const str: string = checker.asCSV(output, undefined, '');
			expect(str.split('\n')[0]).toBe('"module name","license","repository"');
			expect(str.split('\n')[1]).toBe(
				'"@ampproject/remapping@2.2.1","Apache-2.0","https://github.com/ampproject/remapping"'
			);
		});

		test('and convert to MarkDown', (): void => {
			const str: string = checker.asMarkDown(output, undefined);
			expect(str.split('\n')[0]).toBe(
				'- [@ampproject/remapping@2.2.1](https://github.com/ampproject/remapping) - Apache-2.0'
			);
		});
	});

	describe('should parse local with unknown and custom format', (): void => {
		let output: CheckerOutput;

		beforeAll((done): void => {
			const format: CustomFormat = {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			};

			checker.init(
				{
					start: path.join(__dirname, '../'),
					customFormat: format,
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					output = sorted;
					done();
				}
			);
		}, 10000);

		test('and give us results', (): void => {
			expect(Object.keys(output).length).toBeGreaterThan(70);
			expect(output['abbrev@1.0.9']?.description).toBe("Like ruby's abbrev module, but in js");
		});

		test('and convert to CSV', (): void => {
			const format: CustomFormat = {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			};

			const str: string = checker.asCSV(output, format, '');
			expect(str.split('\n')[0]).toBe('"module name","name","description","pewpew"');
			expect(str.split('\n')[1]).toBe(
				'"@ampproject/remapping@2.2.1","@ampproject/remapping","Remap sequential sourcemaps through transformations to point at the original source code","<<Should Never be set>>"'
			);
		});

		test('and convert to CSV with component prefix', (): void => {
			const format: CustomFormat = {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			};

			const str: string = checker.asCSV(output, format, 'main-module');
			expect(str.split('\n')[0]).toBe('"component","module name","name","description","pewpew"');
			expect(str.split('\n')[1]).toBe(
				'"main-module","@ampproject/remapping@2.2.1","@ampproject/remapping","Remap sequential sourcemaps through transformations to point at the original source code","<<Should Never be set>>"'
			);
		});

		test('and convert to MarkDown', (): void => {
			const format: CustomFormat = {
				name: '<<Default Name>>',
				description: '<<Default Description>>',
				pewpew: '<<Should Never be set>>',
			};

			const str: string = checker.asMarkDown(output, format);
			expect(str.split('\n')[0]).toBe('- **[@ampproject/remapping@2.2.1](https://github.com/ampproject/remapping)**');
		});
	});

	describe('should parse local without unknown', (): void => {
		let output: CheckerOutput;

		beforeAll((done): void => {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					unknown: true,
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					output = sorted;
					done();
				}
			);
		}, 10000);

		test('should give us results', (): void => {
			expect(output).toBeTruthy();
			expect(Object.keys(output).length).toBeGreaterThan(20);
		});
	});

	describe('should parse direct dependencies only', (): void => {
		let output: CheckerOutput;

		beforeAll((done): void => {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					direct: 0, // 0 is the parsed value passed to init from license-checker-evergreen if set to true
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					output = sorted;
					done();
				}
			);
		}, 10000);

		test('and give us results', (): void => {
			const pkgDepsNumber: number =
				Object.keys(pkgJson.dependencies || {}).length +
				Object.keys(pkgJson.devDependencies || {}).length +
				Object.keys(pkgJson.peerDependencies || {}).length;
			// all and only the dependencies listed in the package.json should be included in the output,
			// plus the main module itself
			expect(Object.keys(output).length).toBe(pkgDepsNumber + 1);
			expect(typeof output['abbrev@1.0.9']).toBe('undefined');
		});
	});

	describe('should write output to files in programmatic usage', (): void => {
		const tmpFileName: string = path.join(__dirname, 'tmp_output.json');

		beforeAll((done): void => {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					json: true,
					out: tmpFileName,
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					done();
				}
			);
		}, 10000);

		afterAll((): void => {
			if (fs.existsSync(tmpFileName)) {
				fs.unlinkSync(tmpFileName);
			}
		});

		test('and the file should contain parseable JSON', (): void => {
			expect(fs.existsSync(tmpFileName)).toBe(true);

			const outputTxt: string = fs.readFileSync(tmpFileName, 'utf8');
			const outputJson: Record<string, any> = JSON.parse(outputTxt);

			expect(typeof outputJson).toBe('object');
		});
	});

	function parseAndExclude(parsePath: string, licenses: string, result: TestResult): (done: any) => void {
		return function (done): void {
			checker.init(
				{
					start: path.join(__dirname, parsePath),
					excludeLicenses: licenses,
				},
				function (err: Error | null, filtered: CheckerOutput): void {
					result.output = filtered;
					done();
				}
			);
		};
	}

	describe('should parse local with unknown and excludes', (): void => {
		const result: TestResult = {};

		beforeAll(parseAndExclude('../', 'MIT, ISC', result), 10000);

		test('should exclude MIT and ISC licensed modules from results', (): void => {
			let excluded = true;
			const output = result.output;
			if (output) {
				Object.keys(output).forEach(function (item: string): void {
					if (output[item].licenses && (output[item].licenses === 'MIT' || output[item].licenses === 'ISC'))
						excluded = false;
				});
			}
			expect(excluded).toBe(true);
		});
	});

	describe('should parse local with excludes containing commas', (): void => {
		const result: TestResult = {};
		beforeAll(parseAndExclude('./fixtures/excludeWithComma', 'Apache License\\, Version 2.0', result), 10000);

		test('should exclude a license with a comma from the list', (): void => {
			let excluded = true;
			const output = result.output;
			if (output) {
				Object.keys(output).forEach(function (item: string): void {
					if (output[item].licenses && output[item].licenses === 'Apache License, Version 2.0') {
						excluded = false;
					}
				});
			}
			expect(excluded).toBe(true);
		});
	});

	describe('should parse local with BSD excludes', (): void => {
		const result: TestResult = {};
		beforeAll(parseAndExclude('./fixtures/excludeBSD', 'BSD', result), 10000);

		test('should exclude BSD-3-Clause', (): void => {
			let excluded = true;
			const output = result.output;
			if (output) {
				Object.keys(output).forEach(function (item: string): void {
					if (output[item].licenses && output[item].licenses === 'BSD-3-Clause') {
						excluded = false;
					}
				});
			}
			expect(excluded).toBe(true);
		});
	});

	describe('should parse local with Public Domain excludes', (): void => {
		const result: TestResult = {};
		beforeAll(parseAndExclude('./fixtures/excludePublicDomain', 'Public Domain', result), 10000);

		test('should exclude Public Domain', (): void => {
			let excluded = true;
			const output = result.output;
			if (output) {
				Object.keys(output).forEach(function (item: string): void {
					if (output[item].licenses && output[item].licenses === 'Public Domain') {
						excluded = false;
					}
				});
			}
			expect(excluded).toBe(true);
		});
	});

	describe('should not exclude Custom if not specified in excludes', (): void => {
		const result: TestResult = {};
		beforeAll(parseAndExclude('./fixtures/custom-license-file', 'MIT', result), 10000);

		test('should exclude Public Domain', (): void => {
			let excluded = true;
			const output = result.output;
			if (output) {
				Object.keys(output).forEach(function (item: string): void {
					if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md') {
						excluded = false;
					}
				});
			}
			expect(!excluded).toBe(true);
		});
	});

	function parseAndFailOn(
		key: string,
		parsePath: string,
		licenses: string,
		result: TestResult
	): (done: any) => void {
		return function (done): void {
			let exitCode = 0;
			const originalExit = process.exit;
			process.exit = function (code: number): never {
				exitCode = code;
				return undefined as never;
			};
			const config: CheckerOptions = {
				start: path.join(__dirname, parsePath),
			};
			(config as any)[key] = licenses;
			checker.init(config, function (err: Error | null, filtered: CheckerOutput): void {
				result.output = filtered;
				result.exitCode = exitCode;
				process.exit = originalExit;
				done();
			});
		};
	}

	describe('should exit on given list of onlyAllow licenses', (): void => {
		const result: TestResult = {};
		beforeAll(parseAndFailOn('onlyAllow', '../', 'MIT; ISC', result), 10000);

		test('should exit on non MIT and ISC licensed modules from results', (): void => {
			expect(result.exitCode).toBe(1);
		});
	});

	describe('should exit on single onlyAllow license', (): void => {
		const result: TestResult = {};
		beforeAll(parseAndFailOn('onlyAllow', '../', 'ISC', result), 10000);

		test('should exit on non ISC licensed modules from results', (): void => {
			expect(result.exitCode).toBe(1);
		});
	});

	describe('should not exit on complete list', function (): void {
		const result: TestResult = {};
		beforeAll(
			parseAndFailOn(
				'onlyAllow',
				'../',
				'MIT;ISC;MIT;BSD-3-Clause;BSD;Apache-2.0;' +
					'BSD-2-Clause;Apache*;BSD*;CC-BY-3.0;CC-BY-4.0;Unlicense;CC0-1.0;The MIT License;AFLv2.1,BSD;' +
					'Public Domain;Custom: http://i.imgur.com/goJdO.png;WTFPL*;Apache License, Version 2.0;' +
					'WTFPL;(MIT AND CC-BY-3.0);Custom: https://github.com/substack/node-browserify;' +
					'(AFL-2.1 OR BSD-3-Clause);MIT*;0BSD;(MIT OR CC0-1.0);Apache-2.0*;' +
					'BSD-3-Clause OR MIT;(WTFPL OR MIT);Python-2.0',
				result
			)
		);

		test('should not exit if list is complete', (): void => {
			expect(result.exitCode).toBe(0);
		});
	});

	describe('should exit on given list of failOn licenses', (): void => {
		const result: TestResult = {};
		beforeAll(parseAndFailOn('failOn', '../', 'MIT; ISC', result), 10000);

		test('should exit on MIT and ISC licensed modules from results', (): void => {
			expect(result.exitCode).toBe(1);
		});
	});

	describe('should exit on single failOn license', (): void => {
		const result: TestResult = {};
		beforeAll(parseAndFailOn('failOn', '../', 'ISC', result), 10000);

		test('should exit on ISC licensed modules from results', (): void => {
			expect(result.exitCode).toBe(1);
		});
	});

	describe('should parse local and handle private modules', function (): void {
		let output: CheckerOutput;
		beforeAll(function (done): void {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/privateModule'),
				},
				function (err: Error | null, filtered: CheckerOutput): void {
					output = filtered;
					done();
				}
			);
		});

		test('should recognise private modules', (): void => {
			let privateModule = false;

			Object.keys(output).forEach(function (item: string): void {
				if (output[item].licenses && output[item].licenses.indexOf('UNLICENSED') >= 0) {
					privateModule = true;
				}
			});

			expect(privateModule).toBe(true);
		});
	});

	describe('should treat license file over custom urls', function (): void {
		test('should recognise a custom license at a url', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../node_modules/locale'),
				},
				function (err: Error | null, output: CheckerOutput): void {
					const item = output[Object.keys(output)[0]];
					assert.equal(item?.licenses, 'MIT*');
					done();
				}
			);
		});
	});

	describe('should treat URLs as custom licenses', function (): void {
		let output: CheckerOutput;
		beforeAll(function (done): void {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/custom-license-url'),
				},
				function (err: Error | null, filtered: CheckerOutput): void {
					output = filtered;
					done();
				}
			);
		});

		test('should recognise a custom license at a url', function (): void {
			let foundCustomLicense = false;
			Object.keys(output).forEach(function (item: string): void {
				if (output[item].licenses && output[item].licenses === 'Custom: http://example.com/dummy-license')
					foundCustomLicense = true;
			});
			assert.ok(foundCustomLicense);
		});
	});

	describe('should treat file references as custom licenses', function (): void {
		let output: CheckerOutput;
		beforeAll(function (done): void {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/custom-license-file'),
				},
				function (err: Error | null, filtered: CheckerOutput): void {
					output = filtered;
					done();
				}
			);
		});

		test('should recognise a custom license in a file', function (): void {
			let foundCustomLicense = false;
			Object.keys(output).forEach(function (item: string): void {
				if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md') foundCustomLicense = true;
			});
			assert.ok(foundCustomLicense);
		});
	});

	describe('error handler', function (): void {
		test('should init without errors', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					development: true,
				},
				function (err: Error | null): void {
					assert.equal(err, null);
					done();
				}
			);
		});

		test('should init with errors (npm packages not found)', function (done): void {
			checker.init(
				{
					start: 'C:\\',
				},
				function (err: Error | null): void {
					assert.ok(util.isError(err));
					done();
				}
			);
		});
	});

	describe('should parse with args', (): void => {
		test('should handle undefined', (): void => {
			const result = args.setDefaultArguments(undefined);
			expect(result.color).toBe(Boolean(chalk.level > 0));
			expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
		});

		test('should handle color undefined', (): void => {
			const result = args.setDefaultArguments({
				color: undefined,
				start: path.resolve(path.join(__dirname, '../')),
			});
			expect(result.color).toBe(Boolean(chalk.level > 0));
			expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
		});

		test('should handle direct undefined', (): void => {
			const result = args.setDefaultArguments({
				direct: undefined,
				start: path.resolve(path.join(__dirname, '../')),
			});
			expect(result.direct).toBe(Infinity);
			expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
		});

		test('should handle direct true', (): void => {
			const result = args.setDefaultArguments({
				direct: true,
				start: path.resolve(path.join(__dirname, '../')),
			});
			expect(result.direct).toBe(Infinity);
			expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
		});

		test('should override direct option with depth option', (): void => {
			const result = args.setDefaultArguments({
				direct: '9',
				depth: 99,
				start: path.resolve(path.join(__dirname, '../')),
			});
			expect(result.direct).toBe(99);
			expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
		});

		test('should use depth for direct option when direct is not provided', (): void => {
			const result = args.setDefaultArguments({
				depth: 99,
				start: path.resolve(path.join(__dirname, '../')),
			});
			expect(result.direct).toBe(99);
			expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
		});

		['json', 'markdown', 'csv', 'summary'].forEach(function (type: string): void {
			test('should disable color on ' + type, (): void => {
				const def: any = {
					color: undefined,
					start: path.resolve(path.join(__dirname, '../')),
				};
				def[type] = true;
				const result = args.setDefaultArguments(def);
				expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
			});
		});
	});

	describe('custom formats', function (): void {
		test('should create a custom format using customFormat successfully', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					customFormat: {
						name: '<<Default Name>>',
						description: '<<Default Description>>',
						pewpew: '<<Should Never be set>>',
					},
				},
				function (err: Error | null, d: CheckerOutput): void {
					Object.keys(d).forEach(function (item: string): void {
						assert.notEqual(d[item].name, undefined);
						assert.notEqual(d[item].description, undefined);
						assert.notEqual(d[item].pewpew, undefined);
						assert.equal(d[item].pewpew, '<<Should Never be set>>');
					});
					done();
				}
			);
		});

		test('should create a custom format using customPath', function (done): void {
			process.argv.push('--customPath');
			process.argv.push('./customFormatExample.json');

			const argResult = args.getNormalizedArguments(process.argv);
			argResult.start = path.join(__dirname, '../');

			process.argv.pop();
			process.argv.pop();

			checker.init(argResult, function (err: Error | null, filtered: CheckerOutput): void {
				const customFormatContent: string = fs.readFileSync(
					path.join(__dirname, './../customFormatExample.json'),
					'utf8'
				);

				assert.notEqual(customFormatContent, undefined);
				assert.notEqual(customFormatContent, null);

				const customJson: Record<string, any> = JSON.parse(customFormatContent);

				//Test dynamically with the file directly
				Object.keys(filtered).forEach(function (licenseItem: string): void {
					Object.keys(customJson).forEach(function (definedItem: string): void {
						assert.notEqual((filtered[licenseItem] as any)[definedItem], 'undefined');
					});
				});
				done();
			});
		});

		test('should return data for keys with different names in json vs custom format', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/author'),
					customFormat: {
						publisher: '',
					},
				},
				function (err: Error | null, filtered: CheckerOutput): void {
					assert.equal(Object.keys(filtered).length, 1);
					assert.equal(filtered['license-checker-evergreen@0.0.0']?.publisher, 'Roman Seidelsohn');
					done();
				}
			);
		});
	});

	describe('should output the module location', function (): void {
		test('as absolute path', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
				},
				function (err: Error | null, output: CheckerOutput): void {
					Object.keys(output).map(function (key: string): void {
						const expectedPath: string = path.join(__dirname, '../');
						const actualPath: string = output[key].path?.substr(0, expectedPath.length) || '';
						assert.equal(actualPath, expectedPath);
					});
					done();
				}
			);
		});

		test('using only relative paths if the option relativeModulePath is being used', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					relativeModulePath: true,
				},
				function (err: Error | null, output: CheckerOutput): void {
					const rootPath: string = path.join(__dirname, '../');
					Object.keys(output).forEach(function (key: string): void {
						const outputPath: string = output[key].path || '';
						assert.strictEqual(
							outputPath.startsWith(rootPath),
							false,
							`Output path is not a relative path: ${outputPath}`
						);
					});
					done();
				}
			);
		});
	});

	describe('should output the location of the license files', function (): void {
		test('as absolute paths', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
				},
				function (err: Error | null, output: CheckerOutput): void {
					Object.keys(output)
						.map(function (key: string) {
							return output[key];
						})
						.filter(function (dep) {
							return dep.licenseFile !== undefined;
						})
						.forEach(function (dep): void {
							const expectedPath: string = path.join(__dirname, '../');
							const actualPath: string = dep.licenseFile?.substr(0, expectedPath.length) || '';
							assert.equal(actualPath, expectedPath);
						});
					done();
				}
			);
		});

		test('as relative paths when using relativeLicensePath', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					relativeLicensePath: true,
				},
				function (err: Error | null, filtered: CheckerOutput): void {
					Object.keys(filtered)
						.map(function (key: string) {
							return filtered[key];
						})
						.filter(function (dep) {
							return dep.licenseFile !== undefined;
						})
						.forEach(function (dep): void {
							const licenseFile = dep.licenseFile || '';
							assert.notEqual(licenseFile.substr(0, 1), '/');
						});
					done();
				}
			);
		});
	});

	describe('handle copytight statement', function (): void {
		test('should output copyright statements when configured in custom format', function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					customFormat: {
						copyright: '', // specify custom format
						email: false,
						licenseFile: false,
						licenseText: false,
						publisher: false,
					},
				},
				function (err: Error | null, output: CheckerOutput): void {
					assert(output['abbrev@1.0.9'] !== undefined, 'Check if the expected package still exists.');
					assert.equal(output['abbrev@1.0.9']?.copyright, 'Copyright (c) Isaac Z. Schlueter and Contributors');
					done();
				}
			);
		});
	});

	describe('should only list UNKNOWN or guessed licenses successful', function (): void {
		let output: CheckerOutput;
		beforeAll(function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					onlyunknown: true,
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					output = sorted;
					done();
				}
			);
		});

		test('so we check if there is no license with a star or UNKNOWN found', function (): void {
			let onlyStarsFound = true;
			Object.keys(output).forEach(function (item: string): void {
				if (output[item].licenses && output[item].licenses.indexOf('UNKNOWN') !== -1) {
					//Okay
				} else if (output[item].licenses && output[item].licenses.indexOf('*') !== -1) {
					//Okay
				} else {
					onlyStarsFound = false;
				}
			});
			assert.ok(onlyStarsFound);
		});
	});

	function parseAndInclude(
		parsePath: string,
		licenses: string,
		result: TestResult
	): (done: any) => void {
		return function (done): void {
			checker.init(
				{
					start: path.join(__dirname, parsePath),
					includeLicenses: licenses,
				},
				function (err: Error | null, filtered: CheckerOutput): void {
					result.output = filtered;
					done();
				}
			);
		};
	}

	describe('should list given packages', function (): void {
		const result: TestResult = {};
		beforeAll(parseAndInclude('./fixtures/includeBSD', 'BSD', result));

		test('should include only BSD', function (): void {
			const output = result.output;
			assert.ok(Object.keys(output || {}).length === 1);
		});
	});

	describe('should not list not given packages', function (): void {
		const result: TestResult = {};
		beforeAll(parseAndInclude('./fixtures/includeApache', 'BSD', result));

		test('should not include Apache', function (): void {
			const output = result.output;
			assert.ok(Object.keys(output || {}).length === 0);
		});
	});

	describe('should only list UNKNOWN or guessed licenses with errors (argument missing)', function (): void {
		let output: CheckerOutput;
		beforeAll(function (done): void {
			checker.init(
				{
					start: path.join(__dirname, '../'),
					production: true,
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					output = sorted;
					done();
				}
			);
		});

		test('so we check if there is no license with a star or UNKNOWN found', function (): void {
			let onlyStarsFound = true;

			Object.keys(output).forEach(function (item: string): void {
				if (output[item].licenses && output[item].licenses.indexOf('UNKNOWN') !== -1) {
					//Okay
				} else if (output[item].licenses && output[item].licenses.indexOf('*') !== -1) {
					//Okay
				} else {
					onlyStarsFound = false;
				}
			});
			assert.equal(onlyStarsFound, false);
		});
	});

	describe('should export', function (): void {
		test('print a tree', function (): void {
			const log = console.log;
			console.log = function (data: string): void {
				assert.ok(data);
				assert.ok(data.indexOf('└─') > -1);
			};
			checker.print([{}]);
			console.log = log;
		});

		test('as tree', function (): void {
			const data: string = checker.asTree([{}]);
			assert.ok(data);
			assert.ok(data.indexOf('└─') > -1);
		});

		test('as csv', function (): void {
			const data: string = checker.asCSV({
				foo: {
					licenses: 'MIT',
					repository: '/path/to/foo',
				},
			}, undefined, '');
			assert.ok(data);
			assert.ok(data.indexOf('"foo","MIT","/path/to/foo"') > -1);
		});

		test('as csv with partial data', function (): void {
			const data: string = checker.asCSV({
				foo: {},
			}, undefined, '');
			assert.ok(data);
			assert.ok(data.indexOf('"foo","",""') > -1);
		});

		test('as markdown', function (): void {
			const data: string = checker.asMarkDown({
				foo: {
					licenses: 'MIT',
					repository: '/path/to/foo',
				},
			}, undefined);
			assert.ok(data);
			assert.ok(data.indexOf('[foo](/path/to/foo) - MIT') > -1);
		});

		test('as summary', function (): void {
			const data: string = checker.asSummary({
				foo: {
					licenses: 'MIT',
					repository: '/path/to/foo',
				},
			});
			assert.ok(data);
			assert.ok(data.indexOf('└─') > -1);
		});

		test('as files', function (): void {
			const out: string = path.join(require('os').tmpdir(), 'lc');
			let files: string[] | null = null;
			checker.asFiles(
				{
					foo: {
						licenses: 'MIT',
						repository: '/path/to/foo',
						licenseFile: path.join(__dirname, '../LICENSE'),
					},
					bar: {
						licenses: 'MIT',
					},
				},
				out
			);

			files = fs.readdirSync(out);
			assert.equal(files[0], 'foo-LICENSE.txt');
			require('rimraf').sync(out);
		});
	});

	describe('should export', function (): void {
		let output: CheckerOutput;

		beforeAll(function (done): void {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/includeBSD'),
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					output = sorted;
					done();
				}
			);
		});

		test('an Angular CLI like plain vertical format', async function (): Promise<void> {
			const data: string = await checker.asPlainVertical(output);
			assert.ok(data);
			assert.equal(
				data,
				`bsd-3-module 0.0.0
BSD-3-Clause
`
			);
		});
	});

	describe('json parsing', function (): void {
		test('should parse json successfully (File exists + was json)', function (): void {
			const path = './tests/config/custom_format_correct.json';
			const json = checker.parseJson(path);
			assert.notEqual(json, undefined);
			assert.notEqual(json, null);
			assert.equal((json as any).licenseModified, 'no');
			assert.ok((json as any).licenseText);
		});

		test('should parse json with errors (File exists + no json)', function (): void {
			const path = './tests/config/custom_format_broken.json';
			const json = checker.parseJson(path);
			assert.ok(json instanceof Error);
		});

		test('should parse json with errors (File not found)', function (): void {
			const path = './NotExitingFile.json';
			const json = checker.parseJson(path);
			assert.ok(json instanceof Error);
		});

		test('should parse json with errors (null passed)', function (): void {
			const json = checker.parseJson(null as any);
			assert.ok(json instanceof Error);
		});
	});

	describe('limit attributes', function (): void {
		test('should filter attributes based on limitAttributes defined', function (): void {
			const path = './tests/config/custom_format_correct.json';
			const json = checker.parseJson(path);

			const filteredJson = checker.filterAttributes(['version', 'name'], json);

			assert.notStrictEqual((filteredJson as any).version, undefined);
			assert.notStrictEqual((filteredJson as any).name, undefined);
			assert.strictEqual((filteredJson as any).description, undefined);
			assert.strictEqual((filteredJson as any).licenses, undefined);
			assert.strictEqual((filteredJson as any).licenseFile, undefined);
			assert.strictEqual((filteredJson as any).licenseText, undefined);
			assert.strictEqual((filteredJson as any).licenseModified, undefined);
		});

		test('should keep json as is if no outputColumns defined', function (): void {
			const path = './tests/config/custom_format_correct.json';
			const json = checker.parseJson(path);

			const filteredJson = checker.filterAttributes(null as any, json);

			assert.notStrictEqual((filteredJson as any).version, undefined);
			assert.notStrictEqual((filteredJson as any).name, undefined);
			assert.notStrictEqual((filteredJson as any).description, undefined);
			assert.notStrictEqual((filteredJson as any).licenses, undefined);
			assert.notStrictEqual((filteredJson as any).licenseFile, undefined);
			assert.notStrictEqual((filteredJson as any).licenseText, undefined);
			assert.notStrictEqual((filteredJson as any).licenseModified, undefined);
		});
	});
});