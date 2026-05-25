import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
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

	describe('spdxSemantics classification', () => {
		test('populates spdxDenyNormalized and literalDenySet from failOn', () => {
			const pipeline: any = new FilteringPipeline({
				spdxSemantics: true,
				failOn: ['MIT', 'custom-thing', 'gpl-2.0'],
			} as any);
			expect(pipeline.literalDenySet).toBeInstanceOf(Set);
			expect(pipeline.literalDenySet.has('custom-thing')).toBe(true);
			expect(pipeline.literalDenySet.has('MIT')).toBe(false);
			expect(pipeline.literalDenySet.has('gpl-2.0')).toBe(false);
			expect(pipeline.spdxDenyNormalized.has('MIT')).toBe(true);
			expect(pipeline.spdxDenyNormalized.has('GPL-2.0-only')).toBe(true);
		});

		test('does not populate SPDX sets when spdxSemantics is false', () => {
			const pipeline: any = new FilteringPipeline({
				spdxSemantics: false,
				failOn: ['MIT', 'custom-thing'],
				onlyAllow: ['MIT'],
			} as any);
			const literalDeny = pipeline.literalDenySet;
			const spdxDeny = pipeline.spdxDenyNormalized;
			const literalAllow = pipeline.literalAllowSet;
			const spdxAllow = pipeline.spdxAllowNormalized;
			expect((literalDeny?.size ?? 0) + (spdxDeny?.size ?? 0)).toBe(0);
			expect((literalAllow?.size ?? 0) + (spdxAllow?.size ?? 0)).toBe(0);
		});

		test('initializes empty sets and cache when spdxSemantics true but no lists', () => {
			const pipeline: any = new FilteringPipeline({ spdxSemantics: true } as any);
			expect(pipeline.spdxAllowNormalized).toBeInstanceOf(Set);
			expect(pipeline.literalAllowSet).toBeInstanceOf(Set);
			expect(pipeline.spdxDenyNormalized).toBeInstanceOf(Set);
			expect(pipeline.literalDenySet).toBeInstanceOf(Set);
			expect(pipeline.spdxAllowNormalized.size).toBe(0);
			expect(pipeline.literalAllowSet.size).toBe(0);
			expect(pipeline.spdxDenyNormalized.size).toBe(0);
			expect(pipeline.literalDenySet.size).toBe(0);
			expect(pipeline.spdxExprCache).toBeInstanceOf(Map);
			expect(pipeline.spdxExprCache.size).toBe(0);
		});
	});

	describe('spdxSemantics DoS guard', () => {
		test('evaluateSpdxDeny returns false for >4KB license string', () => {
			const pipeline: any = new FilteringPipeline({
				spdxSemantics: true,
				failOn: ['MIT'],
			} as any);
			const huge = 'A'.repeat(5000);
			expect(pipeline.evaluateSpdxDeny(huge)).toBe(false);
		});

		test('evaluateSpdxAllow returns false for >4KB license string', () => {
			const pipeline: any = new FilteringPipeline({
				spdxSemantics: true,
				onlyAllow: ['MIT'],
			} as any);
			const huge = 'A'.repeat(5000);
			expect(pipeline.evaluateSpdxAllow(huge)).toBe(false);
		});
	});

	describe('spdxSemantics helpers — evaluateSpdxDeny truth table', () => {
		const makePipeline = (failOn: string[]) =>
			new FilteringPipeline({ spdxSemantics: true, failOn } as any) as any;

		test('T1: (BSD-3-Clause OR GPL-2.0) + deny [GPL-2.0] → true', () => {
			expect(makePipeline(['GPL-2.0']).evaluateSpdxDeny('(BSD-3-Clause OR GPL-2.0)')).toBe(true);
		});

		test('T2: (MIT OR Apache-2.0) + deny [GPL-2.0] → false', () => {
			expect(makePipeline(['GPL-2.0']).evaluateSpdxDeny('(MIT OR Apache-2.0)')).toBe(false);
		});

		test('T9: (MIT AND GPL-2.0) + deny [GPL-2.0] → true', () => {
			expect(makePipeline(['GPL-2.0']).evaluateSpdxDeny('(MIT AND GPL-2.0)')).toBe(true);
		});

		test('T10: (MIT OR (Apache-2.0 AND GPL-2.0)) + deny [GPL-2.0] → true', () => {
			expect(
				makePipeline(['GPL-2.0']).evaluateSpdxDeny('(MIT OR (Apache-2.0 AND GPL-2.0))'),
			).toBe(true);
		});

		test('case-norm: deny [gpl-2.0] matches GPL-2.0', () => {
			expect(makePipeline(['gpl-2.0']).evaluateSpdxDeny('GPL-2.0')).toBe(true);
		});

		test('literal-hit: deny [Custom] + license "Custom" → true', () => {
			expect(makePipeline(['Custom']).evaluateSpdxDeny('Custom')).toBe(true);
		});

		test('literal-miss: deny [MIT] + license "Custom" → false', () => {
			expect(makePipeline(['MIT']).evaluateSpdxDeny('Custom')).toBe(false);
		});

		test('empty license string → false', () => {
			expect(makePipeline(['MIT']).evaluateSpdxDeny('')).toBe(false);
		});
	});

	describe('spdxSemantics helpers — evaluateSpdxDeny with --failOnUnavoidableOnly', () => {
		const makePipeline = (failOn: string[]) =>
			new FilteringPipeline({ spdxSemantics: true, failOnUnavoidableOnly: true, failOn } as any) as any;

		// OR with a clean alternative → denied license AVOIDABLE → pass (opposite of strict default T1)
		test('(BSD-3-Clause OR GPL-2.0) + deny [GPL-2.0] → false (avoidable via BSD)', () => {
			expect(makePipeline(['GPL-2.0']).evaluateSpdxDeny('(BSD-3-Clause OR GPL-2.0)')).toBe(false);
		});

		// nested: top-level OR offers a GPL-free choice (MIT) → avoidable → pass (opposite of strict default T10)
		test('(MIT OR (Apache-2.0 AND GPL-2.0)) + deny [GPL-2.0] → false (avoidable via MIT)', () => {
			expect(makePipeline(['GPL-2.0']).evaluateSpdxDeny('(MIT OR (Apache-2.0 AND GPL-2.0))')).toBe(false);
		});

		// AND → denied license UNAVOIDABLE → fail (same as strict default)
		test('(MIT AND GPL-2.0) + deny [GPL-2.0] → true (unavoidable)', () => {
			expect(makePipeline(['GPL-2.0']).evaluateSpdxDeny('(MIT AND GPL-2.0)')).toBe(true);
		});

		// every OR branch denied → no clean choice → fail
		test('(GPL-2.0 OR GPL-3.0) + deny [GPL-2.0, GPL-3.0] → true (every branch denied)', () => {
			expect(makePipeline(['GPL-2.0', 'GPL-3.0']).evaluateSpdxDeny('(GPL-2.0 OR GPL-3.0)')).toBe(true);
		});

		// one OR branch denied, the other clean → avoidable → pass
		test('(GPL-2.0 OR GPL-3.0) + deny [GPL-3.0] → false (GPL-2.0 still available)', () => {
			expect(makePipeline(['GPL-3.0']).evaluateSpdxDeny('(GPL-2.0 OR GPL-3.0)')).toBe(false);
		});

		// single denied license → fail (unavoidable)
		test('GPL-2.0 + deny [GPL-2.0] → true', () => {
			expect(makePipeline(['GPL-2.0']).evaluateSpdxDeny('GPL-2.0')).toBe(true);
		});
	});

	describe('spdxSemantics helpers — evaluateSpdxAllow truth table', () => {
		const makePipeline = (onlyAllow: string[]) =>
			new FilteringPipeline({ spdxSemantics: true, onlyAllow } as any) as any;

		test('T3: (MIT OR CC0-1.0) + allow [MIT, ISC] → true', () => {
			expect(makePipeline(['MIT', 'ISC']).evaluateSpdxAllow('(MIT OR CC0-1.0)')).toBe(true);
		});

		test('T4: MIT-restricted-do-not-use + allow [MIT, ISC] → false', () => {
			expect(makePipeline(['MIT', 'ISC']).evaluateSpdxAllow('MIT-restricted-do-not-use')).toBe(false);
		});

		test('T5: (MIT AND Apache-2.0) + allow [MIT, ISC] → false', () => {
			expect(makePipeline(['MIT', 'ISC']).evaluateSpdxAllow('(MIT AND Apache-2.0)')).toBe(false);
		});

		test('T6: (MIT AND Apache-2.0) + allow [MIT, ISC, Apache-2.0] → true', () => {
			expect(
				makePipeline(['MIT', 'ISC', 'Apache-2.0']).evaluateSpdxAllow('(MIT AND Apache-2.0)'),
			).toBe(true);
		});

		test('T7: UNKNOWN + allow [MIT] → false', () => {
			expect(makePipeline(['MIT']).evaluateSpdxAllow('UNKNOWN')).toBe(false);
		});

		test('case-norm: allow [gpl-2.0] matches GPL-2.0', () => {
			expect(makePipeline(['gpl-2.0']).evaluateSpdxAllow('GPL-2.0')).toBe(true);
		});

		test('literal-allow: allow [SEE LICENSE IN README] + same literal → true', () => {
			expect(
				makePipeline(['SEE LICENSE IN README']).evaluateSpdxAllow('SEE LICENSE IN README'),
			).toBe(true);
		});

		test('empty license string → false', () => {
			expect(makePipeline(['MIT']).evaluateSpdxAllow('')).toBe(false);
		});
	});

	describe('checkFailConditions legacy mode', () => {
		let exitSpy: any;
		let errorSpy: any;

		beforeEach(() => {
			exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
				throw new Error(`process.exit:${code}`);
			}) as never);
			errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			exitSpy.mockRestore();
			errorSpy.mockRestore();
		});

		test('T8: --failOn MIT legacy mode on MIT license → exit 1', () => {
			const pipeline: any = new FilteringPipeline({ failOn: ['MIT'] });
			expect(() => pipeline.checkFailConditions('pkg@1.0.0', { licenses: 'MIT' })).toThrow(
				'process.exit:1',
			);
		});

		test('legacy case-sensitive: --failOn MIT on "mit" → no exit', () => {
			const pipeline: any = new FilteringPipeline({ failOn: ['MIT'] });
			expect(() =>
				pipeline.checkFailConditions('pkg@1.0.0', { licenses: 'mit' }),
			).not.toThrow();
		});

		test('legacy substring: --onlyAllow MIT on "MIT-like-thing" → no exit', () => {
			const pipeline: any = new FilteringPipeline({ onlyAllow: ['MIT'] });
			expect(() =>
				pipeline.checkFailConditions('pkg@1.0.0', { licenses: 'MIT-like-thing' }),
			).not.toThrow();
		});
	});

	describe('checkFailConditions spdxSemantics mode', () => {
		let exitSpy: any;
		let errorSpy: any;
		let errorMessages: string[];

		beforeEach(() => {
			errorMessages = [];
			exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
				throw new Error(`process.exit:${code}`);
			}) as never);
			errorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation(((msg: string) => {
					errorMessages.push(msg);
				}) as never);
		});

		afterEach(() => {
			exitSpy.mockRestore();
			errorSpy.mockRestore();
		});

		test('spdxSemantics licenseString for array: (A OR B)', () => {
			const pipeline: any = new FilteringPipeline({
				spdxSemantics: true,
				failOn: ['MIT'],
			} as any);
			expect(() =>
				pipeline.checkFailConditions('pkg', { licenses: ['MIT', 'Apache-2.0'] }),
			).toThrow('process.exit:1');
			expect(errorMessages.join(' ')).toContain('(MIT OR Apache-2.0)');
		});

		test('legacy licenseString for array: "A, B"', () => {
			const pipeline: any = new FilteringPipeline({
				failOn: ['MIT, Apache-2.0'],
			});
			expect(() =>
				pipeline.checkFailConditions('pkg', { licenses: ['MIT', 'Apache-2.0'] }),
			).toThrow('process.exit:1');
			expect(errorMessages.join(' ')).toContain('MIT, Apache-2.0');
		});

		test('defensive String() coercion on non-string license', () => {
			const pipeline: any = new FilteringPipeline({
				spdxSemantics: true,
				failOn: ['MIT'],
			} as any);
			expect(() =>
				pipeline.checkFailConditions('pkg', { licenses: 0 as any }),
			).not.toThrow();
		});
	});

});
