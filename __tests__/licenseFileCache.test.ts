import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'crypto';

import { LicenseFileCache } from '../dist/lib/licenseFileCache.js';

function createTempFile(content: string): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lce-cache-'));
  const filePath = path.join(tmpDir, 'LICENSE');
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('LicenseFileCache', () => {
  let cache: LicenseFileCache;
  let tmpFile: string;
  const licenseText = 'MIT License\n\nCopyright (c) 2025 Test';

  beforeEach(() => {
    cache = new LicenseFileCache();
    tmpFile = createTempFile(licenseText);
  });

  afterAll(() => {
    // Clean up temp files
    const tmpBase = os.tmpdir();
    const dirs = fs.readdirSync(tmpBase).filter((d) => d.startsWith('lce-cache-'));
    for (const dir of dirs) {
      fs.rmSync(path.join(tmpBase, dir), { recursive: true, force: true });
    }
  });

  describe('readLicenseFile (sync)', () => {
    test('should read a file and return content', () => {
      const result = cache.readLicenseFile(tmpFile);
      expect(result.content).toBe(licenseText);
      expect(result.checksum).toBeUndefined();
    });

    test('should generate checksum when requested', () => {
      const result = cache.readLicenseFile(tmpFile, true);
      const expected = createHash('sha256').update(licenseText).digest('hex');
      expect(result.checksum).toBe(expected);
    });

    test('should return cached content on second read', () => {
      cache.readLicenseFile(tmpFile);
      const result = cache.readLicenseFile(tmpFile);
      expect(result.content).toBe(licenseText);
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    test('should generate checksum on demand for cached entry', () => {
      // First read without checksum
      cache.readLicenseFile(tmpFile, false);
      // Second read requesting checksum
      const result = cache.readLicenseFile(tmpFile, true);
      const expected = createHash('sha256').update(licenseText).digest('hex');
      expect(result.checksum).toBe(expected);
    });
  });

  describe('readLicenseFileAsync', () => {
    test('should read a file asynchronously', async () => {
      const result = await cache.readLicenseFileAsync(tmpFile);
      expect(result.content).toBe(licenseText);
    });

    test('should generate checksum when requested', async () => {
      const result = await cache.readLicenseFileAsync(tmpFile, true);
      const expected = createHash('sha256').update(licenseText).digest('hex');
      expect(result.checksum).toBe(expected);
    });

    test('should return cached content on second async read', async () => {
      await cache.readLicenseFileAsync(tmpFile);
      const result = await cache.readLicenseFileAsync(tmpFile);
      expect(result.content).toBe(licenseText);
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    test('should use sync cache if available for async read', async () => {
      // Read sync first
      cache.readLicenseFile(tmpFile);
      // Then async should use sync cache
      const result = await cache.readLicenseFileAsync(tmpFile);
      expect(result.content).toBe(licenseText);
      expect(cache.getStats().hits).toBe(1);
    });

    test('should throw on non-existent file', async () => {
      await expect(
        cache.readLicenseFileAsync('/nonexistent/file.txt'),
      ).rejects.toThrow();
    });

    test('should generate checksum on demand for async cached entry', async () => {
      await cache.readLicenseFileAsync(tmpFile, false);
      const result = await cache.readLicenseFileAsync(tmpFile, true);
      const expected = createHash('sha256').update(licenseText).digest('hex');
      expect(result.checksum).toBe(expected);
    });
  });

  describe('fileExists', () => {
    test('should return true for existing file', () => {
      expect(cache.fileExists(tmpFile)).toBe(true);
    });

    test('should return false for non-existent file', () => {
      expect(cache.fileExists('/nonexistent/file.txt')).toBe(false);
    });

    test('should return true for cached file without hitting filesystem', () => {
      cache.readLicenseFile(tmpFile);
      expect(cache.fileExists(tmpFile)).toBe(true);
    });

    test('should return false for directory path', () => {
      expect(cache.fileExists(os.tmpdir())).toBe(false);
    });
  });

  describe('fileExistsAsync', () => {
    test('should return true for existing file', async () => {
      expect(await cache.fileExistsAsync(tmpFile)).toBe(true);
    });

    test('should return false for non-existent file', async () => {
      expect(await cache.fileExistsAsync('/nonexistent/file.txt')).toBe(false);
    });

    test('should return true for cached file', async () => {
      cache.readLicenseFile(tmpFile);
      expect(await cache.fileExistsAsync(tmpFile)).toBe(true);
    });

    test('should return true for async-cached file', async () => {
      await cache.readLicenseFileAsync(tmpFile);
      expect(await cache.fileExistsAsync(tmpFile)).toBe(true);
    });
  });

  describe('getStats', () => {
    test('should return initial stats', () => {
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalReads).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.cacheSize).toBe(0);
      expect(stats.asyncCacheSize).toBe(0);
    });

    test('should track hit rate correctly', () => {
      cache.readLicenseFile(tmpFile); // miss
      cache.readLicenseFile(tmpFile); // hit
      cache.readLicenseFile(tmpFile); // hit
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(2 / 3);
      expect(stats.cacheSize).toBe(1);
    });
  });

  describe('clear', () => {
    test('should reset cache and stats', () => {
      cache.readLicenseFile(tmpFile);
      cache.clear();
      const stats = cache.getStats();
      expect(stats.totalReads).toBe(0);
      expect(stats.cacheSize).toBe(0);
      expect(stats.asyncCacheSize).toBe(0);
    });
  });

  describe('cleanup', () => {
    test('should remove entries older than maxAge', async () => {
      cache.readLicenseFile(tmpFile);
      expect(cache.getStats().cacheSize).toBe(1);
      // Wait a tick so the entry ages past 1ms
      await new Promise((r) => setTimeout(r, 10));
      cache.cleanup(1);
      expect(cache.getStats().cacheSize).toBe(0);
    });

    test('should keep recent entries', () => {
      cache.readLicenseFile(tmpFile);
      // Cleanup with huge maxAge should keep everything
      cache.cleanup(60 * 60 * 1000);
      expect(cache.getStats().cacheSize).toBe(1);
    });
  });
});
