import { describe, test, expect } from '@jest/globals';
import { licenseFiles } from '../dist/lib/license-files.js';

describe('license files detector', (): void => {
	test('should export a function', (): void => {
		expect(typeof licenseFiles).toBe('function');
	});

	test('no files', (): void => {
		expect(licenseFiles([])).toEqual([]);
	});

	test('no license files', (): void => {
		expect(licenseFiles(['.gitignore', '.travis.yml', 'TODO'])).toEqual([]);
	});

	test('one license candidate', (): void => {
		expect(licenseFiles(['LICENSE', '.gitignore', 'src'])).toEqual(['LICENSE']);
	});

	test('multiple license candidates detected in the right order', (): void => {
		expect(licenseFiles(['COPYING', '.gitignore', 'LICENCE', 'LICENSE', 'src', 'README'])).toEqual([
			'LICENSE',
			'LICENCE',
			'COPYING',
			'README',
		]);
	});

	test('extensions have no effect', (): void => {
		expect(licenseFiles(['LICENCE.txt', '.gitignore', 'src'])).toEqual(['LICENCE.txt']);
	});

	test('lower/upper case has no effect', (): void => {
		expect(licenseFiles(['LiCeNcE', '.gitignore', 'src'])).toEqual(['LiCeNcE']);
	});

	test('LICENSE-MIT gets matched', (): void => {
		expect(licenseFiles(['LICENSE', '.gitignore', 'LICENSE-MIT', 'src'])).toEqual(['LICENSE', 'LICENSE-MIT']);
	});

	test('only the first LICENSE-* file gets matched', (): void => {
		expect(licenseFiles(['license-foobar.txt', '.gitignore', 'LICENSE-MIT'])).toEqual(['license-foobar.txt']);
	});
});