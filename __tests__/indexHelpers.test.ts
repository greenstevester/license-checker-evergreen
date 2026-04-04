import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  deleteNonDirectDependenciesFromAllDependencies,
  getAuthorDetails,
  getCsvData,
  getCsvHeaders,
  getFirstNotUndefinedOrUndefined,
  getLinesWithCopyright,
  getModuleNameForLicenseTextHeader,
  getOptionArray,
  getRepositoryUrl,
  storeReadmeInJsonIfExists,
} from '../dist/lib/indexHelpers.js';

describe('indexHelpers', () => {
  describe('getRepositoryUrl', () => {
    test('should return clarification repository when provided', () => {
      expect(
        getRepositoryUrl({
          clarificationRepository: 'https://example.com/repo',
          jsonRepository: { url: 'https://other.com' },
        }),
      ).toBe('https://example.com/repo');
    });

    test('should convert git+ssh to git protocol', () => {
      expect(
        getRepositoryUrl({
          jsonRepository: { url: 'git+ssh://git@github.com/user/repo.git' },
        }),
      ).toBe('https://github.com/user/repo');
    });

    test('should convert git+https to https', () => {
      expect(
        getRepositoryUrl({
          jsonRepository: { url: 'git+https://github.com/user/repo.git' },
        }),
      ).toBe('https://github.com/user/repo');
    });

    test('should convert git:// to https://', () => {
      expect(
        getRepositoryUrl({
          jsonRepository: { url: 'git://github.com/user/repo.git' },
        }),
      ).toBe('https://github.com/user/repo');
    });

    test('should convert git@ SSH to https', () => {
      expect(
        getRepositoryUrl({
          jsonRepository: { url: 'git@github.com:user/repo.git' },
        }),
      ).toBe('https://github.com/user/repo');
    });

    test('should strip trailing .git', () => {
      expect(
        getRepositoryUrl({
          jsonRepository: { url: 'https://github.com/user/repo.git' },
        }),
      ).toBe('https://github.com/user/repo');
    });

    test('should return undefined when no repository info', () => {
      expect(getRepositoryUrl({})).toBeUndefined();
    });

    test('should return undefined for non-string url', () => {
      expect(
        getRepositoryUrl({ jsonRepository: { url: 123 } }),
      ).toBeUndefined();
    });
  });

  describe('getFirstNotUndefinedOrUndefined', () => {
    test('should return first defined value', () => {
      expect(getFirstNotUndefinedOrUndefined(undefined, 'hello', 'world')).toBe('hello');
    });

    test('should return undefined when all undefined', () => {
      expect(getFirstNotUndefinedOrUndefined(undefined, undefined)).toBeUndefined();
    });

    test('should return first arg if defined', () => {
      expect(getFirstNotUndefinedOrUndefined('first', 'second')).toBe('first');
    });

    test('should treat null and empty string as defined', () => {
      expect(getFirstNotUndefinedOrUndefined(null)).toBeNull();
      expect(getFirstNotUndefinedOrUndefined('')).toBe('');
    });
  });

  describe('getAuthorDetails', () => {
    test('should extract author details from package author', () => {
      const result = getAuthorDetails({
        author: { name: 'John', email: 'john@example.com', url: 'https://john.com' },
      });
      expect(result.publisher).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.url).toBe('https://john.com');
    });

    test('should prefer clarification over author', () => {
      const result = getAuthorDetails({
        clarification: { publisher: 'Corp', email: 'corp@example.com', url: 'https://corp.com' },
        author: { name: 'John', email: 'john@example.com', url: 'https://john.com' },
      });
      expect(result.publisher).toBe('Corp');
      expect(result.email).toBe('corp@example.com');
      expect(result.url).toBe('https://corp.com');
    });

    test('should handle missing fields', () => {
      const result = getAuthorDetails({});
      expect(result.publisher).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.url).toBeUndefined();
    });
  });

  describe('getLinesWithCopyright', () => {
    test('should extract copyright lines', () => {
      const content = 'Copyright (c) 2025 John Doe\n\nSome license text';
      const result = getLinesWithCopyright(content);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Copyright');
    });

    test('should exclude copyright notice lines', () => {
      const content = 'Copyright notice must be included\n\nOther text';
      const result = getLinesWithCopyright(content);
      expect(result).toHaveLength(0);
    });

    test('should exclude copyright and related rights lines', () => {
      const content = 'Copyright and related rights waived\n\nOther text';
      const result = getLinesWithCopyright(content);
      expect(result).toHaveLength(0);
    });

    test('should handle empty string', () => {
      expect(getLinesWithCopyright('')).toEqual([]);
    });

    test('should handle Windows line endings', () => {
      const content = 'Copyright (c) 2025 Test\r\n\r\nLicense text';
      const result = getLinesWithCopyright(content);
      expect(result).toHaveLength(1);
    });
  });

  describe('getOptionArray', () => {
    test('should return array as-is', () => {
      expect(getOptionArray(['MIT', 'ISC'])).toEqual(['MIT', 'ISC']);
    });

    test('should split string by semicolon', () => {
      expect(getOptionArray('MIT;ISC;Apache-2.0')).toEqual(['MIT', 'ISC', 'Apache-2.0']);
    });

    test('should return undefined for non-string/array', () => {
      expect(getOptionArray(undefined)).toBeUndefined();
      expect(getOptionArray(null)).toBeUndefined();
      expect(getOptionArray(123)).toBeUndefined();
    });
  });

  describe('getCsvData', () => {
    test('should generate CSV rows with default format', () => {
      const data = {
        'pkg@1.0.0': { licenses: 'MIT', repository: 'https://github.com/test' },
      };
      const result = getCsvData(data, undefined, '');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('"pkg@1.0.0","MIT","https://github.com/test"');
    });

    test('should include component prefix when specified', () => {
      const data = {
        'pkg@1.0.0': { licenses: 'MIT', repository: 'https://github.com/test' },
      };
      const result = getCsvData(data, undefined, 'my-app');
      expect(result[0]).toContain('"my-app"');
    });

    test('should use custom format keys', () => {
      const data = {
        'pkg@1.0.0': { licenses: 'MIT', publisher: 'John' },
      };
      const customFormat = { licenses: '', publisher: '' };
      const result = getCsvData(data, customFormat, '');
      expect(result[0]).toBe('"pkg@1.0.0","MIT","John"');
    });

    test('should handle empty values', () => {
      const data = { 'pkg@1.0.0': {} };
      const result = getCsvData(data, undefined, '');
      expect(result[0]).toBe('"pkg@1.0.0","",""');
    });
  });

  describe('getCsvHeaders', () => {
    test('should return default headers', () => {
      expect(getCsvHeaders(undefined, '')).toBe('"module name","license","repository"');
    });

    test('should include component prefix header', () => {
      const result = getCsvHeaders(undefined, 'prefix');
      expect(result).toContain('"component"');
    });

    test('should use custom format headers', () => {
      const result = getCsvHeaders({ licenses: '', publisher: '' }, '');
      expect(result).toBe('"module name","licenses","publisher"');
    });
  });

  describe('getModuleNameForLicenseTextHeader', () => {
    test('should split name and version at last @', () => {
      expect(getModuleNameForLicenseTextHeader('lodash@4.17.21')).toBe('lodash 4.17.21\n');
    });

    test('should handle scoped packages', () => {
      expect(getModuleNameForLicenseTextHeader('@babel/core@7.20.0')).toBe('@babel/core 7.20.0\n');
    });
  });

  describe('deleteNonDirectDependenciesFromAllDependencies', () => {
    test('should keep only direct deps in default mode', () => {
      const allDeps = { a: {}, b: {}, c: {} };
      const pkg = {
        _dependencies: { a: '1.0.0', b: '2.0.0' },
        dependencies: allDeps,
        devDependencies: {},
      };
      deleteNonDirectDependenciesFromAllDependencies(pkg, {});
      expect(Object.keys(allDeps)).toEqual(['a', 'b']);
    });

    test('should exclude dev deps in production mode', () => {
      const allDeps = { a: {}, b: {}, devOnly: {} };
      const pkg = {
        _dependencies: { a: '1.0.0', b: '2.0.0', devOnly: '1.0.0' },
        dependencies: allDeps,
        devDependencies: { devOnly: '1.0.0' },
      };
      deleteNonDirectDependenciesFromAllDependencies(pkg, { production: true });
      expect(Object.keys(allDeps)).toEqual(['a', 'b']);
    });

    test('should keep only dev deps in development mode', () => {
      const allDeps = { a: {}, devOnly: {} };
      const pkg = {
        _dependencies: { a: '1.0.0', devOnly: '1.0.0' },
        dependencies: allDeps,
        devDependencies: { devOnly: '1.0.0' },
      };
      deleteNonDirectDependenciesFromAllDependencies(pkg, { development: true });
      expect(Object.keys(allDeps)).toEqual(['devOnly']);
    });

    test('should handle undefined input gracefully', () => {
      expect(() => deleteNonDirectDependenciesFromAllDependencies(undefined, {})).not.toThrow();
    });
  });

  describe('storeReadmeInJsonIfExists', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lce-readme-'));
      fs.writeFileSync(path.join(tmpDir, 'README.md'), '# My Package');
    });

    afterAll(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('should store README content in package json', () => {
      const pkg: any = {};
      storeReadmeInJsonIfExists(tmpDir, pkg);
      expect(pkg.readme).toBe('# My Package');
    });

    test('should not overwrite existing readme', () => {
      const pkg: any = { readme: 'Already has readme' };
      storeReadmeInJsonIfExists(tmpDir, pkg);
      expect(pkg.readme).toBe('Already has readme');
    });

    test('should overwrite "no readme data found" placeholder', () => {
      const pkg: any = { readme: 'no readme data found' };
      storeReadmeInJsonIfExists(tmpDir, pkg);
      expect(pkg.readme).toBe('# My Package');
    });

    test('should handle empty module path', () => {
      const pkg: any = {};
      storeReadmeInJsonIfExists('', pkg);
      expect(pkg.readme).toBeUndefined();
    });

    test('should handle non-object package json', () => {
      // null is typeof 'object' so it passes the type check but has no properties to set
      // The function should exit early for non-object types
      expect(() => storeReadmeInJsonIfExists(tmpDir, 'not-an-object')).not.toThrow();
    });
  });
});
