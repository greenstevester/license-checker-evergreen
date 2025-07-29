import { describe, test, beforeAll, expect } from '@jest/globals';
import path from 'path';
import * as checker from '../dist/lib/index.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


describe('clarifications', () => {
    function parseAndClarify(parsePath, clarificationPath, result) {
        return function(done) {
            checker.init(
                {
                    start: path.join(__dirname, parsePath),
                    clarificationsFile: path.join(__dirname, clarificationPath),
                    customFormat: {
                        "licenses": "",
                        "publisher": "",
                        "email": "",
                        "path": "",
                        "licenseFile": "",
                        "licenseText": ""
                    }
                },
                function(err, filtered) {
                    result.output = filtered;
                    done();
                },
            );
        };
    }

    let result = {};

    const clarifications_path = './fixtures/clarifications';

    beforeAll(parseAndClarify(clarifications_path, '../clarificationExample.json', result));

    test('should replace existing license', () => {
        const output = result.output['license-checker-evergreen@0.0.0'];

        expect(output.licenseText).toBe("Some mild rephrasing of an MIT license");
        expect(output.licenses).toBe("MIT");
    });


    test('should exit 1 if the checksum does not match', (done) => {
        let data = "";
        let license_checker = spawn('node', [path.join(__dirname, '../dist/bin/license-checker-evergreen.js'), '--start', path.join(__dirname, clarifications_path), '--clarificationsFile', path.join(__dirname, clarifications_path, 'mismatch/clarification.json')], {
            cwd: path.join(__dirname, '../'),
        });

        license_checker.stderr.on('data', function(stderr) {
            data += stderr.toString();
        });

        license_checker.on('exit', function(code) {
            expect(code).toBe(1);
            expect(data.includes("checksum mismatch")).toBe(true);
            done();
        });
    });


    test('should succeed if no checksum is specified', (done) => {
        let data = "";

        let license_checker = spawn('node', [path.join(__dirname, '../dist/bin/license-checker-evergreen.js'), '--start', path.join(__dirname, clarifications_path), '--clarificationsFile', path.join(__dirname, clarifications_path, 'example/noChecksum.json')], {
            cwd: path.join(__dirname, '../'),
        });

        license_checker.stdout.on("data", function(stdout) {
            data += stdout.toString();
        })

        license_checker.on('exit', function(code) {
            expect(code).toBe(0);
            expect(data.includes("MIT")).toBe(true);
            expect(data.includes("MY_IP")).toBe(true);
            done();
        });
    })

    test('should snip the embedded license out of the README', (done) => {
        let data = "";

        let license_checker = spawn(
            'node',
            [
                path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
                '--start', path.join(__dirname, clarifications_path),
                '--clarificationsFile', path.join(__dirname, clarifications_path, 'weirdStart/clarification.json'),
                '--customPath', path.join(__dirname, clarifications_path, 'weirdStart/customFormat.json')
            ], {
            cwd: path.join(__dirname, '../'),
        });

        license_checker.stdout.on("data", function(stdout) {
            data += stdout.toString();
        })

        license_checker.on('exit', function(code) {
            expect(code).toBe(0);
            expect(data.includes("README")).toBe(true);
            expect(data.includes("text text text describing the project")).toBe(false);
            expect(data.includes("# LICENSE")).toBe(true);
            expect(data.includes("Standard MIT license")).toBe(true);
            expect(data.includes("# And one more thing...")).toBe(false);
            expect(data.includes("More text AFTER the license because the real world is difficult :(")).toBe(false);
            done();
        });
    })

    test('should snip the embedded license in the README to the end.', (done) => {
        let data = "";

        let license_checker = spawn(
            'node',
            [
                path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
                '--start', path.join(__dirname, clarifications_path),
                '--clarificationsFile', path.join(__dirname, clarifications_path, 'weirdStart/startOnlyClarification.json'),
                '--customPath', path.join(__dirname, clarifications_path, 'weirdStart/customFormat.json')
            ], {
            cwd: path.join(__dirname, '../'),
        });

        license_checker.stdout.on("data", function(stdout) {
            data += stdout.toString();
        })

        license_checker.on('exit', function(code) {
            expect(code).toBe(0);
            expect(data.includes("README")).toBe(true);
            expect(data.includes("text text text describing the project")).toBe(false);
            expect(data.includes("# LICENSE")).toBe(true);
            expect(data.includes("Standard MIT license")).toBe(true);
            expect(data.includes("# And one more thing...")).toBe(true);
            expect(data.includes("More text AFTER the license because the real world is difficult :(")).toBe(true);
            done();
        });
    })
});
