import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { FilteringPipeline } from '../dist/lib/filteringPipeline.js';

describe('FilteringPipeline', () => {
	describe('constructor and initialization', () => {
		test('should create instance with empty options', () => {
			const pipeline = new FilteringPipeline({});
			expect(pipeline).toBeDefined();
		});

		test('should create instance with all options', () => {
			const pipeline = new FilteringPipeline({
				excludeLicenses: ['GPL'],
				includeLicenses: ['MIT'],
				includePackages: ['lodash'],
				excludePackages: ['debug'],
				excludePackagesStartingWith: ['@types'],
				excludePrivatePackages: true,
				onlyunknown: false,
				failOn: ['UNLICENSED'],
				onlyAllow: ['MIT', 'Apache-2.0'],
				colorize: false,
				relativeModulePath: true,
				startPath: '/home/user/project',
			});
			expect(pipeline).toBeDefined();
		});
	});

	describe('processPackage - basic functionality', () => {
		test('should pass package with no filters', () => {
			const pipeline = new FilteringPipeline({});
			const result = pipeline.processPackage('lodash@4.17.21', {
				licenses: 'MIT',
				path: '/path/to/lodash',
			});
			expect(result).not.toBeNull();
			expect(result?.licenses).toBe('MIT');
		});

		test('should handle package with array of licenses', () => {
			const pipeline = new FilteringPipeline({});
			const result = pipeline.processPackage('dual-license@1.0.0', {
				licenses: ['MIT', 'Apache-2.0'],
			});
			expect(result).not.toBeNull();
			expect(result?.licenses).toEqual(['MIT', 'Apache-2.0']);
		});

		test('should set UNKNOWN for missing licenses', () => {
			const pipeline = new FilteringPipeline({ colorize: false });
			const result = pipeline.processPackage('no-license@1.0.0', {
				licenses: '',
			});
			expect(result).not.toBeNull();
			expect(result?.licenses).toBe('UNKNOWN');
		});
	});

	describe('license filtering', () => {
		test('should exclude packages with excluded licenses', () => {
			const pipeline = new FilteringPipeline({
				excludeLicenses: ['GPL-3.0'],
			});
			const result = pipeline.processPackage('gpl-package@1.0.0', {
				licenses: 'GPL-3.0',
			});
			expect(result).toBeNull();
		});

		test('should exclude packages with multiple excluded licenses', () => {
			const pipeline = new FilteringPipeline({
				excludeLicenses: ['GPL-3.0', 'LGPL-3.0'],
			});
			const gplResult = pipeline.processPackage('gpl-package@1.0.0', {
				licenses: 'GPL-3.0',
			});
			const lgplResult = pipeline.processPackage('lgpl-package@1.0.0', {
				licenses: 'LGPL-3.0',
			});
			const mitResult = pipeline.processPackage('mit-package@1.0.0', {
				licenses: 'MIT',
			});
			expect(gplResult).toBeNull();
			expect(lgplResult).toBeNull();
			expect(mitResult).not.toBeNull();
		});

		test('should match UNKNOWN licenses', () => {
			const pipeline = new FilteringPipeline({
				excludeLicenses: ['UNKNOWN'],
			});
			const result = pipeline.processPackage('unknown-package@1.0.0', {
				licenses: 'UNKNOWN',
			});
			expect(result).toBeNull();
		});

		test('should pass packages when no license filters set', () => {
			const pipeline = new FilteringPipeline({});
			const result = pipeline.processPackage('any-package@1.0.0', {
				licenses: 'GPL-3.0',
			});
			expect(result).not.toBeNull();
		});

		test('should pass packages with no license data', () => {
			const pipeline = new FilteringPipeline({
				excludeLicenses: ['GPL-3.0'],
			});
			const result = pipeline.processPackage('no-license@1.0.0', {
				licenses: '',
			});
			// Should pass because empty license doesn't match GPL-3.0
			expect(result).not.toBeNull();
		});
	});

	describe('package filtering', () => {
		test('should include only whitelisted packages', () => {
			const pipeline = new FilteringPipeline({
				includePackages: ['lodash'],
			});
			const lodashResult = pipeline.processPackage('lodash@4.17.21', {
				licenses: 'MIT',
			});
			const debugResult = pipeline.processPackage('debug@4.3.4', {
				licenses: 'MIT',
			});
			expect(lodashResult).not.toBeNull();
			expect(debugResult).toBeNull();
		});

		test('should include package with exact version match', () => {
			const pipeline = new FilteringPipeline({
				includePackages: ['lodash@4.17.21'],
			});
			const exactMatch = pipeline.processPackage('lodash@4.17.21', {
				licenses: 'MIT',
			});
			const differentVersion = pipeline.processPackage('lodash@4.17.20', {
				licenses: 'MIT',
			});
			expect(exactMatch).not.toBeNull();
			expect(differentVersion).toBeNull();
		});

		test('should exclude blacklisted packages', () => {
			const pipeline = new FilteringPipeline({
				excludePackages: ['debug'],
			});
			const debugResult = pipeline.processPackage('debug@4.3.4', {
				licenses: 'MIT',
			});
			const lodashResult = pipeline.processPackage('lodash@4.17.21', {
				licenses: 'MIT',
			});
			expect(debugResult).toBeNull();
			expect(lodashResult).not.toBeNull();
		});

		test('should exclude packages starting with prefix', () => {
			const pipeline = new FilteringPipeline({
				excludePackagesStartingWith: ['@types'],
			});
			const typesResult = pipeline.processPackage('@types/node@18.0.0', {
				licenses: 'MIT',
			});
			const normalResult = pipeline.processPackage('lodash@4.17.21', {
				licenses: 'MIT',
			});
			expect(typesResult).toBeNull();
			expect(normalResult).not.toBeNull();
		});

		test('should handle multiple prefixes', () => {
			const pipeline = new FilteringPipeline({
				excludePackagesStartingWith: ['@types', '@babel'],
			});
			const typesResult = pipeline.processPackage('@types/node@18.0.0', {
				licenses: 'MIT',
			});
			const babelResult = pipeline.processPackage('@babel/core@7.0.0', {
				licenses: 'MIT',
			});
			expect(typesResult).toBeNull();
			expect(babelResult).toBeNull();
		});
	});

	describe('private package filtering', () => {
		test('should exclude private packages when option is set', () => {
			const pipeline = new FilteringPipeline({
				excludePrivatePackages: true,
			});
			const result = pipeline.processPackage('private-pkg@1.0.0', {
				licenses: 'MIT',
				private: true,
			});
			expect(result).toBeNull();
		});

		test('should include private packages when option is not set', () => {
			const pipeline = new FilteringPipeline({
				excludePrivatePackages: false,
			});
			const result = pipeline.processPackage('private-pkg@1.0.0', {
				licenses: 'MIT',
				private: true,
			});
			expect(result).not.toBeNull();
		});

		test('should mark private packages as UNLICENSED', () => {
			const pipeline = new FilteringPipeline({
				excludePrivatePackages: false,
				colorize: false,
			});
			const result = pipeline.processPackage('private-pkg@1.0.0', {
				licenses: 'MIT',
				private: true,
			});
			expect(result?.licenses).toBe('UNLICENSED');
		});
	});

	describe('unknown license filtering', () => {
		test('should only return unknown licenses when onlyunknown is set', () => {
			const pipeline = new FilteringPipeline({
				onlyunknown: true,
			});
			const unknownResult = pipeline.processPackage('unknown-pkg@1.0.0', {
				licenses: 'UNKNOWN',
			});
			const guessedResult = pipeline.processPackage('guessed-pkg@1.0.0', {
				licenses: 'MIT*',
			});
			const knownResult = pipeline.processPackage('known-pkg@1.0.0', {
				licenses: 'MIT',
			});
			expect(unknownResult).not.toBeNull();
			expect(guessedResult).not.toBeNull();
			expect(knownResult).toBeNull();
		});

		test('should transform guessed licenses to UNKNOWN when onlyunknown is set', () => {
			const pipeline = new FilteringPipeline({
				onlyunknown: true,
				colorize: false,
			});
			const result = pipeline.processPackage('guessed-pkg@1.0.0', {
				licenses: 'MIT*',
			});
			expect(result?.licenses).toBe('UNKNOWN');
		});
	});

	describe('path transformations', () => {
		test('should make paths relative when relativeModulePath is set', () => {
			const pipeline = new FilteringPipeline({
				relativeModulePath: true,
				startPath: '/home/user/project',
			});
			const result = pipeline.processPackage('lodash@4.17.21', {
				licenses: 'MIT',
				path: '/home/user/project/node_modules/lodash',
			});
			expect(result?.path).toBe('node_modules/lodash');
		});

		test('should not modify paths when relativeModulePath is not set', () => {
			const pipeline = new FilteringPipeline({
				relativeModulePath: false,
			});
			const result = pipeline.processPackage('lodash@4.17.21', {
				licenses: 'MIT',
				path: '/home/user/project/node_modules/lodash',
			});
			expect(result?.path).toBe('/home/user/project/node_modules/lodash');
		});
	});

	describe('statistics', () => {
		test('should track processed and filtered counts', () => {
			const pipeline = new FilteringPipeline({
				excludePackages: ['debug'],
			});

			pipeline.processPackage('lodash@4.17.21', { licenses: 'MIT' });
			pipeline.processPackage('debug@4.3.4', { licenses: 'MIT' });
			pipeline.processPackage('chalk@5.0.0', { licenses: 'MIT' });

			const stats = pipeline.getStats();
			expect(stats.processed).toBe(3);
			expect(stats.filtered).toBe(2); // debug was excluded
			expect(stats.rejectionRate).toBeCloseTo(0.333, 2);
		});

		test('should reset statistics', () => {
			const pipeline = new FilteringPipeline({});

			pipeline.processPackage('lodash@4.17.21', { licenses: 'MIT' });
			pipeline.processPackage('debug@4.3.4', { licenses: 'MIT' });

			pipeline.reset();

			const stats = pipeline.getStats();
			expect(stats.processed).toBe(0);
			expect(stats.filtered).toBe(0);
			expect(stats.rejectionRate).toBe(0);
		});

		test('should handle zero processed packages', () => {
			const pipeline = new FilteringPipeline({});
			const stats = pipeline.getStats();
			expect(stats.rejectionRate).toBe(0);
		});
	});

	describe('combined filters', () => {
		test('should apply multiple filters together', () => {
			const pipeline = new FilteringPipeline({
				excludeLicenses: ['GPL-3.0'],
				excludePackages: ['debug'],
				excludePackagesStartingWith: ['@types'],
				excludePrivatePackages: true,
			});

			// Should pass - MIT license, not excluded
			const lodashResult = pipeline.processPackage('lodash@4.17.21', {
				licenses: 'MIT',
			});

			// Should fail - excluded package
			const debugResult = pipeline.processPackage('debug@4.3.4', {
				licenses: 'MIT',
			});

			// Should fail - excluded license
			const gplResult = pipeline.processPackage('gpl-pkg@1.0.0', {
				licenses: 'GPL-3.0',
			});

			// Should fail - excluded prefix
			const typesResult = pipeline.processPackage('@types/node@18.0.0', {
				licenses: 'MIT',
			});

			// Should fail - private package
			const privateResult = pipeline.processPackage('private@1.0.0', {
				licenses: 'MIT',
				private: true,
			});

			expect(lodashResult).not.toBeNull();
			expect(debugResult).toBeNull();
			expect(gplResult).toBeNull();
			expect(typesResult).toBeNull();
			expect(privateResult).toBeNull();
		});
	});

});
