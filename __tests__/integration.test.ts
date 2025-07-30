import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import path from 'path';
import * as checker from '../dist/lib/index.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

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
		[key: string]: any;
	};
}

describe('Integration Tests', (): void => {
	describe('Basic parsing with small fixture', (): void => {
		let output: CheckerOutput;

		beforeAll((done): void => {
			// Use a small fixture instead of the entire project
			checker.init(
				{
					start: path.join(__dirname, './fixtures/includeBSD'),
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					if (err) {
						done(err);
						return;
					}
					output = sorted;
					done();
				}
			);
		}, 30000); // Reduced timeout for small fixture

		test('should parse small fixture and give results', (): void => {
			expect(output).toBeTruthy();
			expect(Object.keys(output).length).toBeGreaterThan(0);
			// The BSD fixture should have at least one package
			const firstKey = Object.keys(output)[0];
			expect(output[firstKey]).toHaveProperty('licenses');
		});

		test('should convert fixture output to CSV', (): void => {
			const str: string = checker.asCSV(output, undefined, '');
			expect(str.split('\n')[0]).toBe('"module name","license","repository"');
			expect(str.split('\n').length).toBeGreaterThan(1);
		});

		test('should convert fixture output to MarkDown', (): void => {
			const str: string = checker.asMarkDown(output, undefined);
			expect(str).toBeTruthy();
			expect(str.length).toBeGreaterThan(0);
		});
	});

	describe('Custom license detection', (): void => {
		let output: CheckerOutput;

		beforeAll((done): void => {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/custom-license-file'),
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					if (err) {
						done(err);
						return;
					}
					output = sorted;
					done();
				}
			);
		}, 30000);

		test('should recognize custom license in a file', (): void => {
			let foundCustomLicense = false;
			Object.keys(output).forEach(function (item: string): void {
				const license = output[item].licenses;
				if (license && license.includes('MY-LICENSE.md')) {
					foundCustomLicense = true;
				}
			});
			expect(foundCustomLicense).toBe(true);
		});
	});

	describe('Publisher detection', (): void => {
		let output: CheckerOutput;

		beforeAll((done): void => {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/author'),
					customFormat: {
						publisher: '',
					},
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					if (err) {
						done(err);
						return;
					}
					output = sorted;
					done();
				}
			);
		}, 30000);

		test('should return data for keys with different names in json vs custom format', (): void => {
			expect(Object.keys(output).length).toBe(1);
			expect(output['license-checker-evergreen@0.0.0']?.publisher).toBe('Roman Seidelsohn');
		});
	});

	describe('File output functionality', (): void => {
		const tmpFileName: string = path.join(__dirname, 'tmp_integration_output.json');

		beforeAll((done): void => {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/includeBSD'),
					json: true,
					out: tmpFileName,
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					if (err) {
						done(err);
						return;
					}
					done();
				}
			);
		}, 30000);

		afterAll((): void => {
			if (fs.existsSync(tmpFileName)) {
				fs.unlinkSync(tmpFileName);
			}
		});

		test('should write output to file and contain parseable JSON', (): void => {
			expect(fs.existsSync(tmpFileName)).toBe(true);

			const outputTxt: string = fs.readFileSync(tmpFileName, 'utf8');
			const outputJson: Record<string, any> = JSON.parse(outputTxt);

			expect(typeof outputJson).toBe('object');
			expect(Object.keys(outputJson).length).toBeGreaterThan(0);
		});
	});

	describe('Plain vertical format export', (): void => {
		let output: CheckerOutput;

		beforeAll((done): void => {
			checker.init(
				{
					start: path.join(__dirname, './fixtures/includeBSD'),
				},
				function (err: Error | null, sorted: CheckerOutput): void {
					if (err) {
						done(err);
						return;
					}
					output = sorted;
					done();
				}
			);
		}, 30000);

		test('should export Angular CLI like plain vertical format', async (): Promise<void> => {
			const data: string = await checker.asPlainVertical(output);
			expect(data).toBeTruthy();
			expect(data).toContain('bsd-3-module 0.0.0');
			expect(data).toContain('BSD-3-Clause');
		});
	});
});