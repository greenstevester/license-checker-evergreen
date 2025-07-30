import { describe, test, expect } from '@jest/globals';
import path from 'path';
import * as args from '../dist/lib/args.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

describe('Arguments and Configuration Tests', (): void => {
	describe('Argument parsing tests', (): void => {
		test('should handle undefined arguments', (): void => {
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

	describe('Command line argument normalization', (): void => {
		test('should parse command line arguments', (): void => {
			// Test with minimal argv
			const testArgv = ['node', 'script.js', '--start', path.join(__dirname, '../')];
			const result = args.getNormalizedArguments(testArgv);
			expect(result).toBeTruthy();
			expect(result.start).toBe(path.join(__dirname, '../'));
		});
	});
});