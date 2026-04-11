import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { scanPackages } from '../dist/lib/fastPackageScanner.js';

// Detect symlink support once at module level for conditional test blocks
const CAN_SYMLINK = (() => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lce-symlink-check-'));
  try {
    const target = path.join(tmp, 'target');
    const link = path.join(tmp, 'link');
    fs.mkdirSync(target);
    fs.symlinkSync(target, link, 'dir');
    return true;
  } catch {
    return false;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})();

const describeWithSymlinks = CAN_SYMLINK ? describe : describe.skip;

/**
 * Creates a temporary directory with a fake node_modules layout for testing.
 */
function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'lce-scanner-'));
}

function writePackageJson(
  dir: string,
  pkg: Record<string, unknown>,
): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg));
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('fastPackageScanner', () => {
  describe('flat node_modules layout (npm)', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-project',
        version: '1.0.0',
        dependencies: { 'pkg-a': '1.0.0', 'pkg-b': '2.0.0' },
        devDependencies: { 'pkg-dev': '1.0.0' },
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-a'), {
        name: 'pkg-a',
        version: '1.0.0',
        license: 'MIT',
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-b'), {
        name: 'pkg-b',
        version: '2.0.0',
        license: 'Apache-2.0',
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-dev'), {
        name: 'pkg-dev',
        version: '1.0.0',
        license: 'ISC',
      });
    });

    afterAll(() => cleanup(tmpDir));

    test('should find all packages in flat layout', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.size).toBe(3);
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-b@2.0.0')).toBe(true);
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(true);
    });

    test('should filter to production deps only', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        production: true,
      });
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-b@2.0.0')).toBe(true);
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(false);
    });

    test('should filter to dev deps only', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        development: true,
      });
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-a@1.0.0')).toBe(false);
      expect(result.packages.has('pkg-b@2.0.0')).toBe(false);
    });

    test('should report timing data', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.timing.walkTime).toBeGreaterThanOrEqual(0);
      expect(result.timing.readTime).toBeGreaterThanOrEqual(0);
      expect(result.timing.totalTime).toBeGreaterThanOrEqual(0);
    });

    test('should set root flag on root package', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.root.root).toBe(true);
      expect(result.root.name).toBe('test-project');
    });
  });

  describe('scoped packages', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-scoped',
        version: '1.0.0',
        dependencies: { '@scope/pkg-x': '1.0.0', '@scope/pkg-y': '2.0.0' },
      });
      writePackageJson(
        path.join(tmpDir, 'node_modules', '@scope', 'pkg-x'),
        { name: '@scope/pkg-x', version: '1.0.0', license: 'MIT' },
      );
      writePackageJson(
        path.join(tmpDir, 'node_modules', '@scope', 'pkg-y'),
        { name: '@scope/pkg-y', version: '2.0.0', license: 'BSD-3-Clause' },
      );
    });

    afterAll(() => cleanup(tmpDir));

    test('should find scoped packages', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.size).toBe(2);
      expect(result.packages.has('@scope/pkg-x@1.0.0')).toBe(true);
      expect(result.packages.has('@scope/pkg-y@2.0.0')).toBe(true);
    });
  });

  describe('nested node_modules (npm v2 / deduplication conflicts)', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-nested',
        version: '1.0.0',
        dependencies: { 'pkg-a': '1.0.0' },
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-a'), {
        name: 'pkg-a',
        version: '1.0.0',
        license: 'MIT',
      });
      // pkg-a has its own nested dependency with a different version of pkg-b
      writePackageJson(
        path.join(tmpDir, 'node_modules', 'pkg-a', 'node_modules', 'pkg-b'),
        { name: 'pkg-b', version: '1.0.0', license: 'ISC' },
      );
      // Also a top-level pkg-b
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-b'), {
        name: 'pkg-b',
        version: '2.0.0',
        license: 'Apache-2.0',
      });
    });

    afterAll(() => cleanup(tmpDir));

    test('should find both versions of a nested package', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-b@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-b@2.0.0')).toBe(true);
      expect(result.packages.size).toBe(3);
    });
  });

  describeWithSymlinks('symlinked packages (pnpm-style)', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();

      // Create a .pnpm-like store with real packages
      const storePath = path.join(tmpDir, '.pnpm-store');
      writePackageJson(path.join(storePath, 'pkg-a'), {
        name: 'pkg-a',
        version: '1.0.0',
        license: 'MIT',
      });
      writePackageJson(path.join(storePath, 'pkg-b'), {
        name: 'pkg-b',
        version: '2.0.0',
        license: 'Apache-2.0',
      });

      writePackageJson(tmpDir, {
        name: 'test-symlink',
        version: '1.0.0',
        dependencies: { 'pkg-a': '1.0.0', 'pkg-b': '2.0.0' },
      });

      const nmDir = path.join(tmpDir, 'node_modules');
      fs.mkdirSync(nmDir, { recursive: true });

      fs.symlinkSync(
        path.join(storePath, 'pkg-a'),
        path.join(nmDir, 'pkg-a'),
        'dir',
      );
      fs.symlinkSync(
        path.join(storePath, 'pkg-b'),
        path.join(nmDir, 'pkg-b'),
        'dir',
      );
    });

    afterAll(() => cleanup(tmpDir));

    test('should follow symlinks to find packages', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-b@2.0.0')).toBe(true);
      expect(result.packages.size).toBe(2);
    });
  });

  describeWithSymlinks('circular symlink protection', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-circular',
        version: '1.0.0',
        dependencies: { 'pkg-a': '1.0.0' },
      });

      const nmDir = path.join(tmpDir, 'node_modules');
      writePackageJson(path.join(nmDir, 'pkg-a'), {
        name: 'pkg-a',
        version: '1.0.0',
        license: 'MIT',
      });

      // Create a circular symlink: pkg-a/node_modules -> ../../node_modules
      const nestedNm = path.join(nmDir, 'pkg-a', 'node_modules');
      fs.mkdirSync(nestedNm, { recursive: true });
      fs.symlinkSync(nmDir, path.join(nestedNm, 'circular'), 'dir');
    });

    afterAll(() => cleanup(tmpDir));

    test('should not infinite loop on circular symlinks', async () => {
      // If circular protection is broken, this will timeout
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
    }, 10000);
  });

  describe('bundledDependencies handling', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-bundled',
        version: '1.0.0',
        dependencies: { 'pkg-a': '1.0.0' },
        bundledDependencies: ['pkg-bundled'],
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-a'), {
        name: 'pkg-a',
        version: '1.0.0',
        license: 'MIT',
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-bundled'), {
        name: 'pkg-bundled',
        version: '3.0.0',
        license: 'BSD-2-Clause',
      });
    });

    afterAll(() => cleanup(tmpDir));

    test('should include bundledDependencies in production mode', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        production: true,
      });
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-bundled@3.0.0')).toBe(true);
    });

    test('should not mark bundled deps as extraneous', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      const bundled = result.packages.get('pkg-bundled@3.0.0');
      expect(bundled).toBeDefined();
      expect(bundled!.extraneous).toBe(false);
    });
  });

  describe('bundleDependencies (alternate spelling)', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-bundle-alt',
        version: '1.0.0',
        dependencies: {},
        bundleDependencies: ['pkg-alt'],
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-alt'), {
        name: 'pkg-alt',
        version: '1.0.0',
        license: 'MIT',
      });
    });

    afterAll(() => cleanup(tmpDir));

    test('should handle bundleDependencies (no d) spelling', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        production: true,
      });
      expect(result.packages.has('pkg-alt@1.0.0')).toBe(true);
    });
  });

  describe('empty and missing node_modules', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-empty',
        version: '1.0.0',
      });
    });

    afterAll(() => cleanup(tmpDir));

    test('should handle missing node_modules gracefully', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.size).toBe(0);
      expect(result.root.name).toBe('test-empty');
    });
  });

  describe('packages with missing or invalid package.json', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-invalid',
        version: '1.0.0',
        dependencies: { 'good-pkg': '1.0.0' },
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'good-pkg'), {
        name: 'good-pkg',
        version: '1.0.0',
        license: 'MIT',
      });
      // Directory with no package.json
      fs.mkdirSync(
        path.join(tmpDir, 'node_modules', 'no-pkg-json'),
        { recursive: true },
      );
      // Directory with invalid JSON
      const badDir = path.join(tmpDir, 'node_modules', 'bad-json');
      fs.mkdirSync(badDir, { recursive: true });
      fs.writeFileSync(path.join(badDir, 'package.json'), '{invalid json!!!');
    });

    afterAll(() => cleanup(tmpDir));

    test('should skip packages with missing or invalid package.json', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.has('good-pkg@1.0.0')).toBe(true);
      expect(result.packages.size).toBe(1);
    });
  });

  describe('deduplication (same package@version from multiple locations)', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-dedup',
        version: '1.0.0',
        dependencies: { 'pkg-a': '1.0.0', 'pkg-b': '1.0.0' },
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-a'), {
        name: 'pkg-a',
        version: '1.0.0',
        license: 'MIT',
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-b'), {
        name: 'pkg-b',
        version: '1.0.0',
        license: 'MIT',
      });
      // Duplicate pkg-a nested inside pkg-b
      writePackageJson(
        path.join(tmpDir, 'node_modules', 'pkg-b', 'node_modules', 'pkg-a'),
        { name: 'pkg-a', version: '1.0.0', license: 'MIT' },
      );
    });

    afterAll(() => cleanup(tmpDir));

    test('should deduplicate same name@version packages', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-b@1.0.0')).toBe(true);
      // Same name@version should only appear once
      expect(result.packages.size).toBe(2);
    });
  });

  describe('nopeer option', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-nopeer',
        version: '1.0.0',
        dependencies: { 'pkg-a': '1.0.0' },
        peerDependencies: { 'pkg-peer': '2.0.0' },
        devDependencies: { 'pkg-dev': '1.0.0' },
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-a'), {
        name: 'pkg-a',
        version: '1.0.0',
        license: 'MIT',
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-peer'), {
        name: 'pkg-peer',
        version: '2.0.0',
        license: 'Apache-2.0',
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-dev'), {
        name: 'pkg-dev',
        version: '1.0.0',
        license: 'ISC',
      });
    });

    afterAll(() => cleanup(tmpDir));

    test('should include peer deps in production mode by default', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        production: true,
      });
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-peer@2.0.0')).toBe(true);
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(false);
    });

    test('should exclude peer deps in production mode with nopeer', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        production: true,
        nopeer: true,
      });
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-peer@2.0.0')).toBe(false);
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(false);
    });

    test('nopeer without production flag still includes peer deps', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        nopeer: true,
      });
      // nopeer only affects filtering when combined with production mode;
      // without a filter, all installed packages appear
      expect(result.packages.has('pkg-a@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-peer@2.0.0')).toBe(true);
    });
  });

  describe('development mode transitive dep filtering', () => {
    let tmpDir: string;

    beforeAll(() => {
      tmpDir = createTempDir();
      writePackageJson(tmpDir, {
        name: 'test-dev-transitive',
        version: '1.0.0',
        dependencies: { 'pkg-prod': '1.0.0' },
        devDependencies: { 'pkg-dev': '1.0.0' },
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-prod'), {
        name: 'pkg-prod',
        version: '1.0.0',
        license: 'MIT',
      });
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-dev'), {
        name: 'pkg-dev',
        version: '1.0.0',
        license: 'ISC',
      });
      // Transitive dep of pkg-prod (not listed in root deps)
      writePackageJson(path.join(tmpDir, 'node_modules', 'pkg-transitive'), {
        name: 'pkg-transitive',
        version: '3.0.0',
        license: 'BSD-2-Clause',
      });
      // Nested transitive dep of pkg-dev
      writePackageJson(
        path.join(tmpDir, 'node_modules', 'pkg-dev', 'node_modules', 'pkg-dev-transitive'),
        { name: 'pkg-dev-transitive', version: '1.0.0', license: 'MIT' },
      );
    });

    afterAll(() => cleanup(tmpDir));

    test('should show all packages when no filter is set', async () => {
      const result = await scanPackages({ startPath: tmpDir });
      expect(result.packages.size).toBe(4);
      expect(result.packages.has('pkg-prod@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(true);
      expect(result.packages.has('pkg-transitive@3.0.0')).toBe(true);
      expect(result.packages.has('pkg-dev-transitive@1.0.0')).toBe(true);
    });

    test('should only include direct dev deps in development mode', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        development: true,
      });
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(true);
      // prod direct dep excluded
      expect(result.packages.has('pkg-prod@1.0.0')).toBe(false);
      // transitive deps excluded (not direct dev deps)
      expect(result.packages.has('pkg-transitive@3.0.0')).toBe(false);
      expect(result.packages.has('pkg-dev-transitive@1.0.0')).toBe(false);
    });

    test('should include transitive deps in production mode', async () => {
      const result = await scanPackages({
        startPath: tmpDir,
        production: true,
      });
      expect(result.packages.has('pkg-prod@1.0.0')).toBe(true);
      // transitive deps are included (conservative approach)
      expect(result.packages.has('pkg-transitive@3.0.0')).toBe(true);
      // dev dep excluded
      expect(result.packages.has('pkg-dev@1.0.0')).toBe(false);
    });
  });
});
