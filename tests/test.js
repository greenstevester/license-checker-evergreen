import { describe, test, beforeAll, afterAll, expect, it } from '@jest/globals';
import path from 'path';
import util from 'util';
import * as checker from '../dist/lib/index.js';
import * as args from '../dist/lib/args.js';
import chalk from 'chalk';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgPath = path.join(__dirname, '../package.json');
const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

describe('main tests', () => {
    test('should load init', () => {
        expect(typeof checker.init).toBe('function');
    });

    test('should load print', () => {
        expect(typeof checker.print).toBe('function');
    });

    describe('should parse local with unknown', () => {
        let output;

        beforeAll((done) => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        }, 10000);

        test('and give us results', () => {
            expect(Object.keys(output).length).toBeGreaterThan(70);
            expect(output['abbrev@1.0.9'].licenses).toBe('ISC');
        });

        test('and convert to CSV', () => {
            const str = checker.asCSV(output);
            expect(str.split('\n')[0]).toBe('"module name","license","repository"');
            expect(str.split('\n')[1]).toBe('"@ampproject/remapping@2.2.1","Apache-2.0","https://github.com/ampproject/remapping"');
        });

        test('and convert to MarkDown', () => {
            const str = checker.asMarkDown(output);
            expect(str.split('\n')[0]).toBe('- [@ampproject/remapping@2.2.1](https://github.com/ampproject/remapping) - Apache-2.0');
        });
    });

    describe('should parse local with unknown and custom format', () => {
        let output;

        beforeAll((done) => {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    customFormat: format,
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        }, 10000);

        test('and give us results', () => {
            expect(Object.keys(output).length).toBeGreaterThan(70);
            expect(output['abbrev@1.0.9'].description).toBe("Like ruby's abbrev module, but in js");
        });

        test('and convert to CSV', () => {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asCSV(output, format);
            expect(str.split('\n')[0]).toBe('"module name","name","description","pewpew"');
            expect(str.split('\n')[1]).toBe(
                '"@ampproject/remapping@2.2.1","@ampproject/remapping","Remap sequential sourcemaps through transformations to point at the original source code","<<Should Never be set>>"',
            );
        });

        test('and convert to CSV with component prefix', () => {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asCSV(output, format, 'main-module');
            expect(str.split('\n')[0]).toBe('"component","module name","name","description","pewpew"');
            expect(str.split('\n')[1]).toBe(
                '"main-module","@ampproject/remapping@2.2.1","@ampproject/remapping","Remap sequential sourcemaps through transformations to point at the original source code","<<Should Never be set>>"',
            );
        });

        test('and convert to MarkDown', () => {
            const format = {
                name: '<<Default Name>>',
                description: '<<Default Description>>',
                pewpew: '<<Should Never be set>>',
            };

            const str = checker.asMarkDown(output, format);
            expect(str.split('\n')[0]).toBe('- **[@ampproject/remapping@2.2.1](https://github.com/ampproject/remapping)**');
        });
    });

    describe('should parse local without unknown', () => {
        let output;

        beforeAll((done) => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    unknown: true,
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        }, 10000);

        test('should give us results', () => {
            expect(output).toBeTruthy();
            expect(Object.keys(output).length).toBeGreaterThan(20);
        });
    });

    describe('should parse direct dependencies only', () => {
        let output;

        beforeAll((done) => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    direct: 0, // 0 is the parsed value passed to init from license-checker-evergreen if set to true
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        }, 10000);

        test('and give us results', () => {
            const pkgDepsNumber =
                Object.keys(pkgJson.dependencies || {}).length +
                Object.keys(pkgJson.devDependencies || {}).length +
                Object.keys(pkgJson.peerDependencies || {}).length;
            // all and only the dependencies listed in the package.json should be included in the output,
            // plus the main module itself
            expect(Object.keys(output).length).toBe(pkgDepsNumber + 1);
            expect(typeof output['abbrev@1.0.9']).toBe('undefined');
        });
    });

    describe('should write output to files in programmatic usage', () => {
        const tmpFileName = path.join(__dirname, 'tmp_output.json');

        beforeAll((done) => {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    json: true,
                    out: tmpFileName,
                },
                function (err, sorted) {
                    done();
                },
            );
        }, 10000);

        afterAll(() => {
            if (fs.existsSync(tmpFileName)) {
                fs.unlinkSync(tmpFileName);
            }
        });

        test('and the file should contain parseable JSON', () => {
            expect(fs.existsSync(tmpFileName)).toBe(true);

            const outputTxt = fs.readFileSync(tmpFileName, 'utf8');
            const outputJson = JSON.parse(outputTxt);

            expect(typeof outputJson).toBe('object');
        });
    });

    function parseAndExclude(parsePath, licenses, result) {
        return function (done) {
            checker.init(
                {
                    start: path.join(__dirname, parsePath),
                    excludeLicenses: licenses,
                },
                function (err, filtered) {
                    result.output = filtered;
                    done();
                },
            );
        };
    }

    describe('should parse local with unknown and excludes', () => {
        let result = {};

        beforeAll(parseAndExclude('../', 'MIT, ISC', result), 10000);

        test('should exclude MIT and ISC licensed modules from results', () => {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && (output[item].licenses === 'MIT' || output[item].licenses === 'ISC'))
                    excluded = false;
            });
            expect(excluded).toBe(true);
        });
    });

    describe('should parse local with excludes containing commas', () => {
        let result = {};
        beforeAll(parseAndExclude('./fixtures/excludeWithComma', 'Apache License\\, Version 2.0', result), 10000);

        test('should exclude a license with a comma from the list', () => {
            let excluded = true;
            let output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Apache License, Version 2.0') {
                    excluded = false;
                }
            });
            expect(excluded).toBe(true);
        });
    });

    describe('should parse local with BSD excludes', () => {
        let result = {};
        beforeAll(parseAndExclude('./fixtures/excludeBSD', 'BSD', result), 10000);

        test('should exclude BSD-3-Clause', () => {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'BSD-3-Clause') {
                    excluded = false;
                }
            });
            expect(excluded).toBe(true);
        });
    });

    describe('should parse local with Public Domain excludes', () => {
        let result = {};
        beforeAll(parseAndExclude('./fixtures/excludePublicDomain', 'Public Domain', result), 10000);

        test('should exclude Public Domain', () => {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Public Domain') {
                    excluded = false;
                }
            });
            expect(excluded).toBe(true);
        });
    });

    describe('should not exclude Custom if not specified in excludes', () => {
        let result = {};
        beforeAll(parseAndExclude('./fixtures/custom-license-file', 'MIT', result), 10000);

        test('should exclude Public Domain', () => {
            let excluded = true;
            const output = result.output;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md') {
                    excluded = false;
                }
            });
            expect(!excluded).toBe(true);
        });
    });

    function parseAndFailOn(key, parsePath, licenses, result) {
        return function (done) {
            let exitCode = 0;
            process.exit = function (code) {
                exitCode = code;
            };
            const config = {
                start: path.join(__dirname, parsePath),
            };
            config[key] = licenses;
            checker.init(config, function (err, filtered) {
                result.output = filtered;
                result.exitCode = exitCode;
                done();
            });
        };
    }

    describe('should exit on given list of onlyAllow licenses', () => {
        let result = {};
        beforeAll(parseAndFailOn('onlyAllow', '../', 'MIT; ISC', result), 10000);

        test('should exit on non MIT and ISC licensed modules from results', () => {
            expect(result.exitCode).toBe(1);
        });
    });

    describe('should exit on single onlyAllow license', () => {
        let result = {};
        beforeAll(parseAndFailOn('onlyAllow', '../', 'ISC', result), 10000);

        test('should exit on non ISC licensed modules from results', () => {
            expect(result.exitCode).toBe(1);
        });
    });

    describe('should not exit on complete list', function () {
        let result = {};
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
                result,
            ),
        );

        test('should not exit if list is complete', () => {
            expect(result.exitCode).toBe(0);
        });
    });

    describe('should exit on given list of failOn licenses', () => {
        let result = {};
        beforeAll(parseAndFailOn('failOn', '../', 'MIT; ISC', result), 10000);

        test('should exit on MIT and ISC licensed modules from results', () => {
            expect(result.exitCode).toBe(1);
        });
    });

    describe('should exit on single failOn license', () => {
        let result = {};
        beforeAll(parseAndFailOn('failOn', '../', 'ISC', result), 10000);

        test('should exit on ISC licensed modules from results', () => {
            expect(result.exitCode).toBe(1);
        });
    });

    describe('should parse local and handle private modules', function () {
        let output;
        beforeAll(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/privateModule'),
                },
                function (err, filtered) {
                    output = filtered;
                    done();
                },
            );
        });

        test('should recognise private modules', () => {
            let privateModule = false;

            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses.indexOf('UNLICENSED') >= 0) {
                    privateModule = true;
                }
            });

            expect(privateModule).toBe(true);
        });
    });

    describe('should treat license file over custom urls', function () {
        test('should recognise a custom license at a url', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../node_modules/locale'),
                },
                function (err, output) {
                    const item = output[Object.keys(output)[0]];
                    assert.equal(item.licenses, 'MIT*');
                    done();
                },
            );
        });
    });

    describe('should treat URLs as custom licenses', function () {
        let output;
        beforeAll(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/custom-license-url'),
                },
                function (err, filtered) {
                    output = filtered;
                    done();
                },
            );
        });

        test('should recognise a custom license at a url', function () {
            let foundCustomLicense = false;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Custom: http://example.com/dummy-license')
                    foundCustomLicense = true;
            });
            assert.ok(foundCustomLicense);
        });
    });

    describe('should treat file references as custom licenses', function () {
        let output;
        beforeAll(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/custom-license-file'),
                },
                function (err, filtered) {
                    output = filtered;
                    done();
                },
            );
        });

        test('should recognise a custom license in a file', function () {
            let foundCustomLicense = false;
            Object.keys(output).forEach(function (item) {
                if (output[item].licenses && output[item].licenses === 'Custom: MY-LICENSE.md')
                    foundCustomLicense = true;
            });
            assert.ok(foundCustomLicense);
        });
    });

    describe('error handler', function () {
        test('should init without errors', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    development: true,
                },
                function (err) {
                    assert.equal(err, null);
                    done();
                },
            );
        });

        test('should init with errors (npm packages not found)', function (done) {
            checker.init(
                {
                    start: 'C:\\',
                },
                function (err) {
                    assert.ok(util.isError(err));
                    done();
                },
            );
        });
    });

    describe('should parse with args', () => {
        test('should handle undefined', () => {
            const result = args.setDefaultArguments(undefined);
            expect(result.color).toBe(Boolean(chalk.level > 0));
            expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
        });

        test('should handle color undefined', () => {
            const result = args.setDefaultArguments({ color: undefined, start: path.resolve(path.join(__dirname, '../')) });
            expect(result.color).toBe(Boolean(chalk.level > 0));
            expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
        });

        test('should handle direct undefined', () => {
            const result = args.setDefaultArguments({ direct: undefined, start: path.resolve(path.join(__dirname, '../')) });
            expect(result.direct).toBe(Infinity);
            expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
        });

        test('should handle direct true', () => {
            const result = args.setDefaultArguments({ direct: true, start: path.resolve(path.join(__dirname, '../')) });
            expect(result.direct).toBe(Infinity);
            expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
        });

        test('should override direct option with depth option', () => {
            const result = args.setDefaultArguments({ direct: '9', depth: '99', start: path.resolve(path.join(__dirname, '../')) });
            expect(result.direct).toBe(99);
            expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
        });

        test('should use depth for direct option when direct is not provided', () => {
            const result = args.setDefaultArguments({ depth: '99', start: path.resolve(path.join(__dirname, '../')) });
            expect(result.direct).toBe(99);
            expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
        });

        ['json', 'markdown', 'csv', 'summary'].forEach(function (type) {
            test('should disable color on ' + type, () => {
                let def = {
                    color: undefined,
                    start: path.resolve(path.join(__dirname, '../')),
                };
                def[type] = true;
                const result = args.setDefaultArguments(def);
                expect(result.start).toBe(path.resolve(path.join(__dirname, '../')));
            });
        });
    });

    describe('custom formats', function () {
        test('should create a custom format using customFormat successfully', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    customFormat: {
                        name: '<<Default Name>>',
                        description: '<<Default Description>>',
                        pewpew: '<<Should Never be set>>',
                    },
                },
                function (err, d) {
                    Object.keys(d).forEach(function (item) {
                        assert.notEqual(d[item].name, undefined);
                        assert.notEqual(d[item].description, undefined);
                        assert.notEqual(d[item].pewpew, undefined);
                        assert.equal(d[item].pewpew, '<<Should Never be set>>');
                    });
                    done();
                },
            );
        });

        test('should create a custom format using customPath', function (done) {
            process.argv.push('--customPath');
            process.argv.push('./customFormatExample.json');

            args = args.getNormalizedArguments(process.argv);
            args.start = path.join(__dirname, '../');

            process.argv.pop();
            process.argv.pop();

            checker.init(args, function (err, filtered) {
                var customFormatContent = fs.readFileSync(
                    path.join(__dirname, './../customFormatExample.json'),
                    'utf8',
                );

                assert.notEqual(customFormatContent, undefined);
                assert.notEqual(customFormatContent, null);

                var customJson = JSON.parse(customFormatContent);

                //Test dynamically with the file directly
                Object.keys(filtered).forEach(function (licenseItem) {
                    Object.keys(customJson).forEach(function (definedItem) {
                        assert.notEqual(filtered[licenseItem][definedItem], 'undefined');
                    });
                });
                done();
            });
        });

        test('should return data for keys with different names in json vs custom format', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, './fixtures/author'),
                    customFormat: {
                        publisher: '',
                    },
                },
                function (err, filtered) {
                    assert.equal(Object.keys(filtered).length, 1);
                    assert.equal(filtered['license-checker-evergreen@0.0.0'].publisher, 'Roman Seidelsohn');
                    done();
                },
            );
        });
    });

    describe('should output the module location', function () {
        test('as absolute path', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                function (err, output) {
                    Object.keys(output).map(function (key) {
                        const expectedPath = path.join(__dirname, '../');
                        const actualPath = output[key].path.substr(0, expectedPath.length);
                        assert.equal(actualPath, expectedPath);
                    });
                    done();
                },
            );
        });

        test('using only relative paths if the option relativeModulePath is being used', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    relativeModulePath: true,
                },
                function (err, output) {
                    const rootPath = path.join(__dirname, '../');
                    Object.keys(output).forEach(function (key) {
                        const outputPath = output[key].path;
                        assert.strictEqual(
                            outputPath.startsWith(rootPath),
                            false,
                            `Output path is not a relative path: ${outputPath}`,
                        );
                    });
                    done();
                },
            );
        });
    });

    describe('should output the location of the license files', function () {
        test('as absolute paths', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                },
                function (err, output) {
                    Object.keys(output)
                        .map(function (key) {
                            return output[key];
                        })
                        .filter(function (dep) {
                            return dep.licenseFile !== undefined;
                        })
                        .forEach(function (dep) {
                            const expectedPath = path.join(__dirname, '../');
                            const actualPath = dep.licenseFile.substr(0, expectedPath.length);
                            assert.equal(actualPath, expectedPath);
                        });
                    done();
                },
            );
        });

        test('as relative paths when using relativeLicensePath', function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    relativeLicensePath: true,
                },
                function (err, filtered) {
                    Object.keys(filtered)
                        .map(function (key) {
                            return filtered[key];
                        })
                        .filter(function (dep) {
                            return dep.licenseFile !== undefined;
                        })
                        .forEach(function (dep) {
                            assert.notEqual(dep.licenseFile.substr(0, 1), '/');
                        });
                    done();
                },
            );
        });
    });

    describe('handle copytight statement', function () {
        test('should output copyright statements when configured in custom format', function (done) {
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
                function (err, output) {
                    assert(output['abbrev@1.0.9'] !== undefined, 'Check if the expected package still exists.');
                    assert.equal(output['abbrev@1.0.9'].copyright, 'Copyright (c) Isaac Z. Schlueter and Contributors');
                    done();
                },
            );
        });
    });

    describe('should only list UNKNOWN or guessed licenses successful', function () {
        let output;
        beforeAll(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    onlyunknown: true,
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        test('so we check if there is no license with a star or UNKNOWN found', function () {
            let onlyStarsFound = true;
            Object.keys(output).forEach(function (item) {
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

    function parseAndInclude(parsePath, licenses, result) {
        return function (done) {
            checker.init(
                {
                    start: path.join(__dirname, parsePath),
                    includeLicenses: licenses,
                },
                function (err, filtered) {
                    result.output = filtered;
                    done();
                },
            );
        };
    }

    describe('should list given packages', function () {
        let result = {};
        beforeAll(parseAndInclude('./fixtures/includeBSD', 'BSD', result));

        test('should include only BSD', function () {
            const output = result.output;
            assert.ok(Object.keys(output).length === 1);
        });
    });

    describe('should not list not given packages', function () {
        let result = {};
        beforeAll(parseAndInclude('./fixtures/includeApache', 'BSD', result));

        test('should not include Apache', function () {
            const output = result.output;
            assert.ok(Object.keys(output).length === 0);
        });
    });

    describe('should only list UNKNOWN or guessed licenses with errors (argument missing)', function () {
        let output;
        beforeAll(function (done) {
            checker.init(
                {
                    start: path.join(__dirname, '../'),
                    production: true,
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        test('so we check if there is no license with a star or UNKNOWN found', function () {
            let onlyStarsFound = true;

            Object.keys(output).forEach(function (item) {
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

    describe('should export', function () {
        test('print a tree', function () {
            const log = console.log;
            console.log = function (data) {
                assert.ok(data);
                assert.ok(data.indexOf('└─') > -1);
            };
            checker.print([{}]);
            console.log = log;
        });

        test('as tree', function () {
            const data = checker.asTree([{}]);
            assert.ok(data);
            assert.ok(data.indexOf('└─') > -1);
        });

        test('as csv', function () {
            const data = checker.asCSV({
                foo: {
                    licenses: 'MIT',
                    repository: '/path/to/foo',
                },
            });
            assert.ok(data);
            assert.ok(data.indexOf('"foo","MIT","/path/to/foo"') > -1);
        });

        test('as csv with partial data', function () {
            const data = checker.asCSV({
                foo: {},
            });
            assert.ok(data);
            assert.ok(data.indexOf('"foo","",""') > -1);
        });

        test('as markdown', function () {
            const data = checker.asMarkDown({
                foo: {
                    licenses: 'MIT',
                    repository: '/path/to/foo',
                },
            });
            assert.ok(data);
            assert.ok(data.indexOf('[foo](/path/to/foo) - MIT') > -1);
        });

        test('as summary', function () {
            const data = checker.asSummary({
                foo: {
                    licenses: 'MIT',
                    repository: '/path/to/foo',
                },
            });
            assert.ok(data);
            assert.ok(data.indexOf('└─') > -1);
        });

        test('as files', function () {
            const out = path.join(require('os').tmpdir(), 'lc');
            let files = null;
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
                out,
            );

            files = fs.readdirSync(out);
            assert.equal(files[0], 'foo-LICENSE.txt');
            require('rimraf').sync(out);
        });
    });

    describe('should export', function () {
        let output;

        beforeAll(function (done) {

            checker.init(
                {
                    start: path.join(__dirname, './fixtures/includeBSD'),
                },
                function (err, sorted) {
                    output = sorted;
                    done();
                },
            );
        });

        test('an Angular CLI like plain vertical format', function () {
            const data = checker.asPlainVertical(output);
            assert.ok(data);
            assert.equal(
                data,
                `bsd-3-module 0.0.0
BSD-3-Clause
`,
            );
        });
    });

    describe('json parsing', function () {
        test('should parse json successfully (File exists + was json)', function () {
            const path = './tests/config/custom_format_correct.json';
            const json = checker.parseJson(path);
            assert.notEqual(json, undefined);
            assert.notEqual(json, null);
            assert.equal(json.licenseModified, 'no');
            assert.ok(json.licenseText);
        });

        test('should parse json with errors (File exists + no json)', function () {
            const path = './tests/config/custom_format_broken.json';
            const json = checker.parseJson(path);
            assert.ok(json instanceof Error);
        });

        test('should parse json with errors (File not found)', function () {
            const path = './NotExitingFile.json';
            const json = checker.parseJson(path);
            assert.ok(json instanceof Error);
        });

        test('should parse json with errors (null passed)', function () {
            const json = checker.parseJson(null);
            assert.ok(json instanceof Error);
        });
    });

    describe('limit attributes', function () {
        test('should filter attributes based on limitAttributes defined', function () {
            const path = './tests/config/custom_format_correct.json';
            const json = checker.parseJson(path);

            const filteredJson = checker.filterAttributes(['version', 'name'], json);

            assert.notStrictEqual(filteredJson.version, undefined);
            assert.notStrictEqual(filteredJson.name, undefined);
            assert.strictEqual(filteredJson.description, undefined);
            assert.strictEqual(filteredJson.licenses, undefined);
            assert.strictEqual(filteredJson.licenseFile, undefined);
            assert.strictEqual(filteredJson.licenseText, undefined);
            assert.strictEqual(filteredJson.licenseModified, undefined);
        });

        test('should keep json as is if no outputColumns defined', function () {
            const path = './tests/config/custom_format_correct.json';
            const json = checker.parseJson(path);

            const filteredJson = checker.filterAttributes(null, json);

            assert.notStrictEqual(filteredJson.version, undefined);
            assert.notStrictEqual(filteredJson.name, undefined);
            assert.notStrictEqual(filteredJson.description, undefined);
            assert.notStrictEqual(filteredJson.licenses, undefined);
            assert.notStrictEqual(filteredJson.licenseFile, undefined);
            assert.notStrictEqual(filteredJson.licenseText, undefined);
            assert.notStrictEqual(filteredJson.licenseModified, undefined);
        });
    });
});
