# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- **Install dependencies**: `npm install`
- **Build project**: `npm run build` (`tsc` → `dist/` with `.d.ts` type definitions)
- **Run tests**: `npm test` (ts-jest under `NODE_OPTIONS=--experimental-vm-modules`)
- **Run tests with coverage**: `npm run test:coverage`
- **Watch tests**: `npm run test:watch`
- **Run a single test file**: `npm test -- __tests__/args.test.ts`
- **Run tests by name**: `npm test -- --testNamePattern="reject expired"`
- **Lint**: `npm run lint` (`eslint --ext ts,js .`) / `npm run lint:fix`
- **Format**: `npm run prettier` (check) / `npm run prettier:fix` (write) / `npm run lint-prettier` (prettier:fix + lint:fix)
- **Run the CLI from source after build**: `node dist/bin/license-checker-evergreen.js [flags]`
- **Debug logging**: `DEBUG=license-checker-evergreen:* node dist/bin/license-checker-evergreen.js` (namespaces `:log` and `:error`)

> ESLint uses the flat-config file `eslint.config.js` (not `.eslintrc.json`). Jest config is `jest.config.cjs`; tests live in `__tests__/` and are written in **TypeScript** (`*.test.ts`), with a 120s timeout.

## Architecture

A Node.js CLI tool (`license-checker-evergreen`) for extracting and analyzing NPM package licenses. Feature-enhanced, TypeScript, ES-module fork of the original `license-checker`. Requires Node >=18, npm >=8 (`engine-strict`).

### Two scanning modes (the key thing to understand)

`src/bin/license-checker-evergreen.ts` branches on the `--legacy` flag:

- **Fast mode (default)** → `index.ts:initFast()` → `scanPackagesAsync()` in `fastPackageScanner.ts`. A custom parallel `node_modules` walker (claims ~8–12x faster than legacy). Computes the prod/dev dependency sets itself (with `--nopeer` handling) and reads each `package.json` concurrently via a bounded `parallelMap`.
- **Legacy mode (`--legacy`)** → `index.ts:init()` → the `read-installed` package (note: the dep is `read-installed`, **not** `read-installed-packages`, despite a stale reference in `jest.config.cjs`'s `transformIgnorePatterns`). Slower but resolves the tree the way npm itself does.

Both modes converge on the same downstream pipeline: `recursivelyCollectAllDependencies()` (in `index.ts`) enriches each module with license info, then a `FilteringPipeline` applies include/exclude/allow/fail rules, then `licenseCheckerHelpers.ts` formats output. When changing scan behavior, check whether the change belongs in the shared path or only one mode — and keep the two modes' results consistent.

### Module map (`src/lib/`)

- **index.ts** (~1500 lines): orchestrator. `initFast`, `init`, `recursivelyCollectAllDependencies`, license-file scanning, SPDX correction, and the result-shaping logic. Exports the public library API.
- **fastPackageScanner.ts**: the fast walker — `scanPackages` / `scanPackagesAsync`, prod/dev dep-set resolution, bounded parallel reads.
- **filteringPipeline.ts**: `FilteringPipeline` class — applies `includePackages`/`excludePackages`/`excludeLicenses`/`onlyAllow`/`failOn`/`excludePrivatePackages` etc.
- **packageInfo.ts** / **packageCollection.ts**: `PackageInfo` and `PackageCollection` value types modeling a scanned module and the set of them.
- **licenseFileCache.ts**: `LicenseFileCache` (exported as a `licenseFileCache` singleton) — caches license-file reads/lookups across modules.
- **getLicenseTitle.ts**: license detection/normalization via SPDX validation.
- **license-files.ts**: known license filenames and discovery patterns (LICENSE, LICENCE, COPYING, README…).
- **licenseCheckerHelpers.ts**: output formatting — JSON, CSV, Markdown, tree, plain-vertical (Angular CLI), summary; plus colorization.
- **args.ts**: `nopt`-based parsing; `knownOptions` is the source of truth for valid flags.
- **exitProcessOrWarnIfNeeded.ts**: validates parsed args / unknown-flag handling before running.
- **indexHelpers.ts**, **usageMessage.ts**: shared helpers and `--help` text.

### Notable CLI flags

Beyond the originals: `--legacy` (slow/compatible scanner), `--failOn <list>` and `--onlyAllow <list>` (semicolon-separated SPDX, fail the run on violation), `--summary`, `--nopeer` (drop peerDependencies), `--excludePrivatePackages`, `--production` / `--development`, `--depth`. Full list: `knownOptions` in `src/lib/args.ts`.

**SPDX-aware allow/deny (opt-in):** `--spdxSemantics` evaluates `--failOn`/`--onlyAllow` as SPDX expressions rather than literal strings (default scanner only — it's a no-op under `--legacy`). By default `--failOn` fails if a denied license appears *anywhere* in an expression, so `(MIT OR GPL-3.0)` fails when `GPL-3.0` is denied. Adding `--failOnUnavoidableOnly` makes `--failOn` fail only when the denied license is *unavoidable* — `(MIT OR GPL-3.0)` then passes, since the package is usable under MIT — which makes `--failOn` the De Morgan dual of `--onlyAllow` (the two flags agree on the same expression). The evaluation lives in `evaluateSpdxDeny` (strict: `walkSpdxLeaves`; unavoidable-only: `reduceSpdxBool`) in `filteringPipeline.ts`.

### GitHub Action

`action.yml` is a **composite** action wrapping the published CLI (`npm install -g license-checker-evergreen@latest` then runs it). Inputs map to CLI flags (`fail-on`, `only-allow`, `exclude-packages`, `output-format`, etc.); outputs are `report` and `packages-count`. `.github/workflows/action-test.yml` exercises it across Node 18/20/22. Editing `action.yml`'s shell step is editing user-facing behavior — keep it aligned with the CLI flags it shells out to.

### Special features

- **Clarification files**: JSON overrides for detected license info, with checksum verification (`--clarificationsFile`).
- **SPDX compliance**: expression parsing/validation/correction via `spdx-correct`, `spdx-expression-parse`, `spdx-satisfies`.
- **Custom output**: `--customFormat` / `--customPath` for user-defined fields.

### Conventions

- **ES modules**: `"type": "module"`. TypeScript source imports use `.js` extensions (e.g. `import … from './args.js'`) so emitted ESM resolves correctly. `read-installed` is pulled in via `createRequire` because it ships no types.
- **Indentation**: tabs (see `.editorconfig` / `.prettierrc`).

### Non-core tooling (don't confuse with the product)

`scripts/` (marketing-automation, competitor-tracker, generate-outreach — run via `npm run marketing:*` / `track:competitors`), `marketing/`, `vhs/`, `demos/`, and `data/` are project/marketing automation, not part of the shipped library. The published package only includes `dist/`, `src/`, `CHANGELOG.md`, `SECURITY.md` (see `files` in package.json).
