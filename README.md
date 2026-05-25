# License Checker Evergreen

**Scan and validate NPM package licenses in your Node.js projects.**

A modern, actively maintained fork of the popular [license-checker](https://github.com/davglass/license-checker) with TypeScript, performance improvements, and new features.

[![npm version](https://img.shields.io/npm/v/license-checker-evergreen.svg)](https://www.npmjs.com/package/license-checker-evergreen)
[![npm downloads](https://img.shields.io/npm/dm/license-checker-evergreen.svg)](https://www.npmjs.com/package/license-checker-evergreen)
[![npm total downloads](https://img.shields.io/npm/dt/license-checker-evergreen.svg)](https://www.npmjs.com/package/license-checker-evergreen)
[![license](https://img.shields.io/npm/l/license-checker-evergreen.svg)](https://github.com/greenstevester/license-checker-evergreen/blob/main/LICENSE)
[![node version](https://img.shields.io/node/v/license-checker-evergreen.svg)](https://www.npmjs.com/package/license-checker-evergreen)

[![NPM](https://nodei.co/npm/license-checker-evergreen.png)](https://www.npmjs.com/package/license-checker-evergreen)

## Why Switch from license-checker?

The original `license-checker` package has **760,000+ weekly downloads** but hasn't been updated since **January 2019**. This fork is actively maintained with significant improvements.

### Performance: 2-4x Faster

![Performance Comparison](demos/performance-comparison.gif)

#### Benchmark Results

| Project | Packages | license-checker | license-checker-evergreen | Speedup |
|---------|----------|-----------------|---------------------------|---------|
| Playwright | 551 | 0.93-2.58s | **0.28-0.72s** | **1.7-3.4x faster** |
| Puppeteer | 784 | 1.09-1.43s | **0.27-1.32s** | **3.0-4.2x faster** |

*Benchmarks: 5 runs each, macOS, warm filesystem cache. Results vary by hardware and project size.*

### Quick Comparison

| Feature | license-checker | license-checker-evergreen |
|---------|-----------------|---------------------------|
| Last Updated | Jan 2019 | **Active** |
| Open Issues | 96 | **0** |
| TypeScript | No | **Native** |
| ES Modules | No | **Yes** |
| Node.js 18+ | Untested | **Optimized** |
| Parallel Scanning | No | **Yes (50 concurrent)** |

> **[View Full Comparison](docs/COMPARISON-TABLES.md)** - Vulnerabilities, dependencies, test coverage, and more.

### Why It's Faster

The new parallel package scanner replaces the slow `read-installed` bottleneck:
- Parallel file reading (50 concurrent operations)
- Single-pass directory walking
- Batched I/O operations

### Migration (30 seconds)

```bash
npm uninstall license-checker
npm install license-checker-evergreen
# Update scripts: license-checker → license-checker-evergreen
```

**Drop-in replacement** - same CLI flags, same output formats.

---

## Features

- ✅ **Active maintenance** - Regular updates, security patches, 0 open issues
- ✅ **2-4x faster** - Parallel scanning with 50 concurrent file operations
- ✅ **TypeScript native** - Full TypeScript with included type definitions
- ✅ **Modern stack** - ES Modules, Node.js 18+ optimized
- ✅ **Comprehensive testing** - Jest test suite with coverage reporting
- ✅ **More output formats** - JSON, CSV, Markdown, Tree, Plain Vertical

## Quick Start

**Prerequisites**: Node.js ≥18, npm ≥8

### Installation

```bash
# Install globally (recommended)
npm install -g license-checker-evergreen

# Or use npx (no installation needed)
npx license-checker-evergreen
```

### Basic Usage

```bash
# Scan current project
license-checker-evergreen
```

![Basic Usage Demo](demos/basic-usage.gif)

See the tool in action scanning your project dependencies and displaying license information in an easy-to-read tree format.

### Common Use Cases

<details>
<summary><b>📄 Export to JSON file</b></summary>

```bash
license-checker-evergreen --json --out licenses.json
```

![JSON Output Demo](demos/json-output.gif)
</details>

<details>
<summary><b>🔍 Find packages with unknown licenses</b></summary>

```bash
license-checker-evergreen --onlyunknown
```

![Unknown Licenses Demo](demos/unknown-licenses.gif)
</details>

<details>
<summary><b>🏭 Check only production dependencies</b></summary>

```bash
license-checker-evergreen --production
```

![Production Only Demo](demos/production-only.gif)
</details>

<details>
<summary><b>📊 Export to CSV format</b></summary>

```bash
license-checker-evergreen --csv --out licenses.csv
```

![CSV Output Demo](demos/csv-output.gif)
</details>

<details>
<summary><b>🚫 Fail build if GPL licenses found</b></summary>

```bash
license-checker-evergreen --failOn 'GPL;AGPL'
```

![Fail On Licenses Demo](demos/fail-on-licenses.gif)
</details>

<details>
<summary><b>🎯 Scan only direct dependencies</b></summary>

```bash
license-checker-evergreen --depth 0 --legacy
```

> Note: the default scanner currently ignores `--depth` ([#15](https://github.com/greenstevester/license-checker-evergreen/issues/15)); use `--legacy` until that's fixed.

![Direct Dependencies Demo](demos/direct-deps.gif)
</details>

## Table of Contents

- [Quick Start](#quick-start)
- [Output Formats](#output-formats)
- [CLI Options](#cli-options)
- [Programmatic Usage](#programmatic-usage)
- [Advanced Features](docs/advanced-features.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Contributing](#contributing)
- [License & Maintainers](docs/license-and-maintainers.md)

## Output Formats

### Default (Tree View)

```
├─ express@4.18.2
│  ├─ licenses: MIT
│  ├─ repository: https://github.com/expressjs/express
│  └─ path: ./node_modules/express
├─ lodash@4.17.21
│  ├─ licenses: MIT
│  └─ path: ./node_modules/lodash
```

**Note:** An asterisk (`*`) after a license means it was detected from a LICENSE file rather than package.json.

### JSON Output

```bash
license-checker-evergreen --json
```

```
{
  "express@4.18.2": {
    "licenses": "MIT",
    "repository": "https://github.com/expressjs/express",
    "path": "./node_modules/express"
  },
  "lodash@4.17.21": {
    "licenses": "MIT",
    "path": "./node_modules/lodash"
  }
}
```

### CSV Output

```bash
license-checker-evergreen --csv --out licenses.csv
```

```
module_name,licenses,repository,path
express@4.18.2,MIT,https://github.com/expressjs/express,./node_modules/express
lodash@4.17.21,MIT,,./node_modules/lodash
```

### Markdown Output

```bash
license-checker-evergreen --markdown
```

![Markdown Output Demo](demos/markdown-output.gif)

## CLI Options

### Filtering Dependencies

| Option | Description |
|--------|-------------|
| `--production` | Show only production dependencies |
| `--development` | Show only development dependencies |
| `--depth [number]` | Limit dependency depth (e.g., `--depth 2`). ⚠️ Currently effective only with `--legacy`; ignored by the default scanner ([#15](https://github.com/greenstevester/license-checker-evergreen/issues/15)). |
| `--nopeer` | Exclude peer dependencies |

### Filtering Licenses

| Option | Description |
|--------|-------------|
| `--excludeLicenses [list]` | Exclude packages with specific licenses (comma-separated) |
| `--includeLicenses [list]` | Include only packages with specific licenses (comma-separated) |
| `--onlyunknown` | Show only packages with unknown/guessed licenses |
| `--unknown` | Report guessed licenses as unknown |

### Filtering Packages

| Option | Description |
|--------|-------------|
| `--excludePackages [list]` | Exclude specific packages (semicolon-separated) |
| `--includePackages [list]` | Include only specific packages (semicolon-separated) |
| `--excludePackagesStartingWith [list]` | Exclude packages by prefix (comma-separated) |
| `--excludePrivatePackages` | Exclude private packages |

### Compliance & CI/CD

| Option | Description |
|--------|-------------|
| `--failOn [list]` | Exit with code 1 if these licenses found (semicolon-separated) |
| `--onlyAllow [list]` | Exit with code 1 if licenses NOT in this list (semicolon-separated) |
| `--spdxSemantics` | Evaluate `--failOn` and `--onlyAllow` as SPDX expressions (opt-in; default is literal string match). Only applies to the default scanner, not `--legacy`. |
| `--failOnUnavoidableOnly` | With `--spdxSemantics`, make `--failOn` fail only when a denied license is *unavoidable* (e.g. `(MIT OR GPL-3.0)` passes when only `GPL-3.0` is denied). |

#### `--spdxSemantics` (opt-in SPDX-expression semantics)

By default, `--failOn` uses literal string equality and `--onlyAllow` uses substring
matching. Both are unreliable for dual-licensed packages (`(MIT OR GPL-2.0)`,
`(MIT AND Apache-2.0)`, etc.). Pass `--spdxSemantics` to evaluate both lists as
SPDX expressions:

- `--failOn "GPL-2.0" --spdxSemantics` fails any package whose license expression
  contains `GPL-2.0` anywhere in an OR/AND tree. Example: `(BSD-3-Clause OR GPL-2.0)` fails.
- `--onlyAllow "MIT;Apache-2.0" --spdxSemantics` allows `(MIT OR CC0-1.0)` (any
  OR-alternative suffices) but rejects `(MIT AND GPL-2.0)` (all AND-terms must be
  allowed).

Add `--failOnUnavoidableOnly` to soften `--failOn` to "fail only if the denied
license is *unavoidable*": `(MIT OR GPL-2.0) --failOn "GPL-2.0"` then **passes**
(the package is usable under MIT), while `(MIT AND GPL-2.0)` still fails. This makes
`--failOn` the De Morgan dual of `--onlyAllow`, so the two flags agree on the same
expression. The strict any-leaf behavior above is the default.

Scope:
- Only affects `--failOn` and `--onlyAllow`. `--includeLicenses` and
  `--excludeLicenses` were already SPDX-aware.
- No effect under `--legacy` (prints a warning if combined).
- Legacy array license field `"licenses": [...]` is treated as `(A OR B OR ...)`.

Examples always quote the list to avoid shell `;` interpretation:

```bash
license-checker-evergreen --failOn "GPL-2.0;AGPL" --spdxSemantics
license-checker-evergreen --onlyAllow "MIT;Apache-2.0;BSD-3-Clause" --spdxSemantics
```

### Output Options

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--csv` | Output in CSV format |
| `--markdown` | Output in Markdown format |
| `--plainVertical` | Output in plain vertical format (Angular CLI style) |
| `--summary` | Show license usage summary |
| `--out [filepath]` | Write output to file |
| `--customPath [filepath]` | Custom output format (see [Custom Format](#custom-format)) |

### Advanced Options

| Option | Description |
|--------|-------------|
| `--start [path]` | Starting directory (defaults to current directory) |
| `--files [path]` | Copy all license files to directory |
| `--relativeLicensePath` | Use relative paths for license files |
| `--relativeModulePath` | Use relative paths for module files |
| `--limitAttributes [list]` | Limit output to specific attributes |
| `--clarificationsFile [filepath]` | Provide license clarifications (see [Clarifications](#clarifications)) |

<details>
<summary><b>View all options (alphabetical reference)</b></summary>

- `--clarificationsFile [filepath]` - License clarifications file (see [Clarifications](#clarifications))
- `--clarificationsMatchAll [boolean]` - Require all clarifications to be used
- `--csv` - Output in CSV format
- `--csvComponentPrefix` - Prefix column for component in CSV format
- `--customPath [filepath]` - Custom format file in JSON (see [Custom Format](#custom-format))
- `--depth [number]` - Dependency depth limit. ⚠️ Currently effective only with `--legacy`; ignored by the default scanner ([#15](https://github.com/greenstevester/license-checker-evergreen/issues/15)).
- `--development` - Show only development dependencies
- `--excludeLicenses [list]` - Exclude packages by license (comma-separated)
- `--excludePackages [list]` - Exclude specific packages (semicolon-separated)
- `--excludePackagesStartingWith [list]` - Exclude packages by prefix (comma-separated)
- `--excludePrivatePackages` - Exclude private packages
- `--failOn [list]` - Fail if these licenses found (semicolon-separated)
- `--failOnUnavoidableOnly` - With `--spdxSemantics`, fail `--failOn` only when a denied license is unavoidable
- `--files [path]` - Copy license files to directory
- `--includeLicenses [list]` - Include only these licenses (comma-separated)
- `--includePackages [list]` - Include only these packages (semicolon-separated)
- `--json` - Output in JSON format
- `--limitAttributes [list]` - Limit output attributes (comma-separated)
- `--markdown` - Output in Markdown format
- `--nopeer` - Skip peer dependencies
- `--onlyAllow [list]` - Fail if licenses NOT in list (semicolon-separated)
- `--onlyunknown` - Show only packages with unknown licenses
- `--out [filepath]` - Write output to file
- `--plainVertical` - Plain vertical format (Angular CLI style)
- `--production` - Show only production dependencies
- `--relativeLicensePath` - Use relative paths for license files
- `--relativeModulePath` - Use relative paths for module files
- `--spdxSemantics` - Evaluate `--failOn`/`--onlyAllow` as SPDX expressions (opt-in)
- `--start [filepath]` - Starting directory path
- `--summary` - Show license usage summary
- `--unknown` - Report guessed licenses as unknown
- `--version` - Show version
- `--help` - Show help

</details>

## Programmatic Usage

### JavaScript (CommonJS)

```javascript
const checker = require('license-checker-evergreen');

checker.init(
    {
        start: '/path/to/project',
        production: true,
    },
    function (err, packages) {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Found licenses:', packages);
        }
    }
);
```

### TypeScript / ES Modules

```typescript
import { init } from 'license-checker-evergreen';

init(
    {
        start: '/path/to/project',
        production: true,
    },
    (err: Error | null, packages: Record<string, unknown>) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Found licenses:', packages);
        }
    }
);
```

### Available Options

All CLI options are available programmatically with camelCase names:

```typescript
{
    start: string;              // Starting directory
    production?: boolean;       // Production only
    development?: boolean;      // Development only
    direct?: boolean | number;  // Direct deps or depth
    json?: boolean;             // JSON output
    excludeLicenses?: string;   // Comma-separated
    includeLicenses?: string;   // Comma-separated
    failOn?: string;           // Semicolon-separated
    onlyAllow?: string;        // Semicolon-separated
    customPath?: string;       // Custom format file
    // ... and more (see CLI Options)
}
```

## Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# Clone repository
git clone https://github.com/greenstevester/license-checker-evergreen.git
cd license-checker-evergreen

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint and format
npm run lint
npm run format
```

### Requirements

- **Node.js** ≥18
- **npm** ≥8
- TypeScript knowledge helpful but not required

### How to Contribute

1. **Report Issues**: Use [GitHub Issues](https://github.com/greenstevester/license-checker-evergreen/issues) for bugs or feature requests
2. **Submit PRs**: Fork the repo, create a feature branch, submit a pull request
3. **Improve Docs**: Documentation improvements are always welcome
4. **Add Tests**: Help improve test coverage

### Project Structure

```
src/
├── bin/                    # CLI entry point
├── lib/
│   ├── index.ts           # Core scanning logic
│   ├── args.ts            # Argument parsing
│   ├── getLicenseTitle.ts # License detection
│   └── ...                # Other modules
__tests__/                  # Jest test suite
dist/                       # Compiled output
```

## What's New

### Version 6.3.0 (Current)

- ✅ **SPDX-aware compliance** — `--spdxSemantics` evaluates `--failOn`/`--onlyAllow` as SPDX expressions, correctly handling dual-licensed packages like `(MIT OR GPL-3.0)`
- ✅ **`--failOnUnavoidableOnly`** — fail only when a denied license is *unavoidable* (the De Morgan dual of `--onlyAllow`)
- ✅ **GitHub Action** — composite `action.yml` for license checking in CI
- ✅ **Supply-chain hardening** — all workflow actions pinned to commit SHAs; `npm audit` clean

### Version 6.1–6.2

- ✅ **Parallel package scanner** is the default (legacy `read-installed` scanner still available via `--legacy`)
- ✅ Scanner reliability improvements and expanded test coverage

### Version 5.x

- Full TypeScript migration with type definitions
- Jest testing framework with comprehensive coverage
- Modern Node.js 18+ support with ES modules

### Version 4.x

- Added `--depth` option for dependency depth control
- Semver range support in clarifications file
- `--clarificationsMatchAll` option

**[View Full Changelog →](CHANGELOG.md)** | **[View Releases →](https://github.com/greenstevester/license-checker-evergreen/releases)**

---

**[Advanced Features](docs/advanced-features.md)** | **[Troubleshooting](docs/troubleshooting.md)** | **[License & Maintainers](docs/license-and-maintainers.md)**
