import { describe, test, expect } from '@jest/globals';
import { licenseFiles } from '../lib/license-files.js';

describe('license files detector', () => {
    test('should export a function', () => {
        expect(typeof licenseFiles).toBe('function');
    });

    test('no files', () => {
        expect(licenseFiles([])).toEqual([]);
    });

    test('no license files', () => {
        expect(licenseFiles(['.gitignore', '.travis.yml', 'TODO'])).toEqual([]);
    });

    test('one license candidate', () => {
        expect(licenseFiles(['LICENSE', '.gitignore', 'src'])).toEqual(['LICENSE']);
    });

    test('multiple license candidates detected in the right order', () => {
        expect(licenseFiles(['COPYING', '.gitignore', 'LICENCE', 'LICENSE', 'src', 'README'])).toEqual([
            'LICENSE',
            'LICENCE',
            'COPYING',
            'README',
        ]);
    });

    test('extensions have no effect', () => {
        expect(licenseFiles(['LICENCE.txt', '.gitignore', 'src'])).toEqual(['LICENCE.txt']);
    });

    test('lower/upper case has no effect', () => {
        expect(licenseFiles(['LiCeNcE', '.gitignore', 'src'])).toEqual(['LiCeNcE']);
    });

    test('LICENSE-MIT gets matched', () => {
        expect(licenseFiles(['LICENSE', '.gitignore', 'LICENSE-MIT', 'src'])).toEqual(['LICENSE', 'LICENSE-MIT']);
    });

    test('only the first LICENSE-* file gets matched', () => {
        expect(licenseFiles(['license-foobar.txt', '.gitignore', 'LICENSE-MIT'])).toEqual(['license-foobar.txt']);
    });
});
