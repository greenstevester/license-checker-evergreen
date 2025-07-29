# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- **Install dependencies**: `npm install`
- **Build project**: `npm run build` (compiles TypeScript to dist/ directory)
- **Run tests**: `npm test` (runs Jest tests with ES module support)
- **Run tests with coverage**: `npm run test:coverage`
- **Watch tests**: `npm run test:watch`
- **Run single test**: `npm test -- --testNamePattern="test name"` or `npm test tests/specific-test.js`
- **Lint code**: `npm run lint` or `npm run lint:fix`
- **Format code**: `npm run format` (prettier + eslint fix) or `npm run format:dry` (check only)
- **Check formatting**: `npm run prettier`
- **CLI binary**: Located at `dist/bin/license-checker-evergreen.js` after build
- **Debug mode**: `DEBUG=license-checker-evergreen* npm test` or when running CLI

## Architecture

This is a Node.js CLI tool (`license-checker-evergreen`) for extracting and analyzing NPM package licenses. It's a feature-enhanced fork of the original license-checker that uses ES modules.

### Key Components

- **src/bin/license-checker-evergreen.ts**: CLI entry point that parses arguments via `args.ts` and delegates to `index.ts`
- **src/lib/index.ts**: Core license scanning engine with `recursivelyCollectAllDependencies` function and `init()` main entry point
- **src/lib/args.ts**: Command-line argument parsing using `nopt` with `knownOptions` definitions
- **src/lib/licenseCheckerHelpers.ts**: Output formatting utilities (JSON, CSV, Markdown, plain vertical)
- **src/lib/getLicenseTitle.ts**: License detection and normalization using SPDX validation
- **src/lib/license-files.ts**: License file discovery patterns and known license file names
- **src/lib/indexHelpers.ts**: Utility functions for package data extraction and path processing

### Core Workflow

The main process (`init` → `recursivelyCollectAllDependencies`) works as follows:
1. Uses `read-installed-packages` to walk dependency tree recursively
2. For each module, extracts license info from package.json or clarification files
3. Scans for license files using patterns from `license-files.js` (LICENSE, COPYING, README)
4. Validates SPDX compliance with `spdx-correct` and applies transformations
5. Supports filtering (include/exclude packages/licenses), depth limits, and custom output formats
6. Handles clarification files for overriding detected license information

### Development Setup

- **TypeScript**: Full TypeScript codebase in `src/` directory, compiles to `dist/` with type definitions
- **ES Modules**: Uses `"type": "module"` in package.json, imports in TypeScript use `.js` extensions for compatibility
- **Build Process**: `npm run build` compiles TypeScript using `tsc`, output goes to `dist/` directory
- **ESLint**: `.eslintrc.json` with TypeScript support, tab indentation, and Prettier integration
- **Node.js**: Requires Node >=18, npm >=8 (enforced via `engine-strict`)

### Testing Strategy

- **Test Runner**: Jest with Node.js environment via `jest.config.cjs`
- **Test Structure**: Tests in `/tests/` directory, written in JavaScript
- **Test Commands**: `npm test` (basic), `npm run test:coverage` (with coverage), `npm run test:watch` (watch mode)
- **Fixtures**: Mock package.json files and license scenarios in test fixtures
- **ES Module Support**: Jest configured with `--experimental-vm-modules` for ES module compatibility
- **Test Timeout**: 10 second default timeout for complex dependency operations

### Key Dependencies

- **`read-installed-packages`**: Recursive npm dependency tree traversal
- **`nopt`**: Command-line argument parsing with type validation
- **`spdx-correct`**: SPDX license identifier validation and normalization
- **`spdx-expression-parse`**: SPDX license expression parsing and validation
- **`chalk`**: Terminal color output for formatted display
- **`debug`**: Debug logging with `license-checker-evergreen:*` namespace

### Special Features

- **Clarification Files**: JSON files for overriding detected license information with checksum verification
- **Custom Output Formats**: Supports JSON, CSV, Markdown, Tree, and Plain Vertical (Angular CLI) formats
- **Advanced Filtering**: Include/exclude by packages, licenses, or package name patterns
- **License File Detection**: Prioritized scanning of LICENSE, LICENCE, COPYING, README files
- **SPDX Compliance**: Full SPDX license expression validation and correction
