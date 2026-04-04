import { describe, test, expect } from '@jest/globals';

import {
  shouldColorizeOutput,
  getFormattedOutput,
} from '../dist/lib/licenseCheckerHelpers.js';

describe('licenseCheckerHelpers', () => {
  describe('shouldColorizeOutput', () => {
    test('should return true when color is set and no file/format output', () => {
      expect(shouldColorizeOutput({ color: true })).toBe(true);
    });

    test('should return false when color is not set', () => {
      expect(shouldColorizeOutput({})).toBeFalsy();
    });

    test('should return false when --out is specified', () => {
      expect(shouldColorizeOutput({ color: true, out: '/tmp/out.txt' })).toBe(false);
    });

    test('should return false when --files is specified', () => {
      expect(shouldColorizeOutput({ color: true, files: '/tmp/files' })).toBe(false);
    });

    test('should return false when --csv is specified', () => {
      expect(shouldColorizeOutput({ color: true, csv: true })).toBe(false);
    });

    test('should return false when --json is specified', () => {
      expect(shouldColorizeOutput({ color: true, json: true })).toBe(false);
    });

    test('should return false when --markdown is specified', () => {
      expect(shouldColorizeOutput({ color: true, markdown: true })).toBe(false);
    });

    test('should return false when --plainVertical is specified', () => {
      expect(shouldColorizeOutput({ color: true, plainVertical: true })).toBe(false);
    });
  });

  describe('getFormattedOutput', () => {
    const sampleData = {
      'pkg-a@1.0.0': {
        licenses: 'MIT',
        repository: 'https://github.com/test/pkg-a',
        publisher: 'Test Author',
      },
      'pkg-b@2.0.0': {
        licenses: 'Apache-2.0',
        repository: 'https://github.com/test/pkg-b',
        publisher: 'Other Author',
      },
    };

    test('should output JSON format', async () => {
      const result = await getFormattedOutput(sampleData, { json: true });
      const parsed = JSON.parse(result);
      expect(parsed['pkg-a@1.0.0'].licenses).toBe('MIT');
      expect(parsed['pkg-b@2.0.0'].licenses).toBe('Apache-2.0');
    });

    test('should output CSV format', async () => {
      const result = await getFormattedOutput(sampleData, { csv: true });
      expect(result).toContain('"pkg-a@1.0.0"');
      expect(result).toContain('"MIT"');
      expect(result).toContain('"module name"');
    });

    test('should output Markdown format', async () => {
      const result = await getFormattedOutput(sampleData, { markdown: true });
      expect(result).toContain('[pkg-a@1.0.0]');
      expect(result).toContain('MIT');
    });

    test('should output summary format', async () => {
      const result = await getFormattedOutput(sampleData, { summary: true });
      expect(result).toContain('MIT');
      expect(result).toContain('Apache-2.0');
    });

    test('should output tree format by default', async () => {
      const result = await getFormattedOutput(sampleData, {});
      expect(result).toContain('├─');
    });

    test('should filter attributes with limitAttributes', async () => {
      const result = await getFormattedOutput(sampleData, {
        json: true,
        limitAttributes: 'licenses',
      });
      const parsed = JSON.parse(result);
      expect(parsed['pkg-a@1.0.0'].licenses).toBe('MIT');
      expect(parsed['pkg-a@1.0.0'].repository).toBeUndefined();
    });
  });
});
