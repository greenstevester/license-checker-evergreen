# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- **Install dependencies**: `npm install`
- **Run tests**: `npm test` (runs eslint --fix, jenkins-mocha tests, and nyc coverage)
- **Run single test**: `npx jenkins-mocha tests/[test-name].js`
- **Lint code**: `npm run lint` or `npm run lint:fix`
- **Format code**: `npm run format` (prettier + eslint fix) or `npm run format:dry` (check only)
- **Check formatting**: `npm run prettier`
- **Coverage check**: `npm run posttest` (automatically runs after test)
- **Build CLI**: Binary is pre-built at `bin/license-checker-evergreen.js`

## Architecture

This is a Node.js CLI tool (`license-checker-evergreen`) for extracting and analyzing NPM package licenses. It's a feature-enhanced fork of the original license-checker that uses ES modules.

### Key Components

- **bin/license-checker-evergreen.js**: CLI entry point that parses arguments via `args.js` and delegates to `index.js`
- **lib/index.js**: Core license scanning engine with `recursivelyCollectAllDependencies` function and `init()` main entry point
- **lib/args.js**: Command-line argument parsing using `nopt` with `knownOptions` definitions
- **lib/licenseCheckerHelpers.js**: Output formatting utilities (JSON, CSV, Markdown, plain vertical)
- **lib/getLicenseTitle.js**: License detection and normalization using SPDX validation
- **lib/license-files.js**: License file discovery patterns and known license file names
- **lib/indexHelpers.js**: Utility functions for package data extraction and path processing

### Core Workflow

The main process (`init` → `recursivelyCollectAllDependencies`) works as follows:
1. Uses `read-installed-packages` to walk dependency tree recursively
2. For each module, extracts license info from package.json or clarification files
3. Scans for license files using patterns from `license-files.js` (LICENSE, COPYING, README)
4. Validates SPDX compliance with `spdx-correct` and applies transformations
5. Supports filtering (include/exclude packages/licenses), depth limits, and custom output formats
6. Handles clarification files for overriding detected license information

### Development Setup

- **ES Modules**: Uses `"type": "module"` in package.json, all imports use `.js` extensions
- **ESLint**: `.eslintrc.json` with tab indentation, Prettier integration, and ES2020 support
- **TypeScript**: `tsconfig.json` for type definitions (`.d.ts` files), but main code is JavaScript
- **Coverage**: NYC with 80% minimum thresholds for lines/statements/functions/branches
- **Node.js**: Requires Node >=18, npm >=8 (enforced via `engine-strict`)

### Testing Strategy

- **Test Runner**: jenkins-mocha with fixtures in `/tests/fixtures/`
- **Test Structure**: Main tests in `test.js`, specific feature tests in separate files
- **Fixtures**: Mock package.json files and license scenarios for different test cases
- **Coverage**: Automatic coverage reporting with NYC, fails if below 80% threshold
