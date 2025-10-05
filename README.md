# License Checker Evergreen

**Scan and validate NPM package licenses in your Node.js projects.**

A modern, actively maintained fork of the popular [license-checker](https://github.com/davglass/license-checker) with TypeScript, performance improvements, and new features.

[![NPM](https://nodei.co/npm/license-checker-evergreen.png)](https://nodei.co/npm/license-checker-evergreen/)

## Why Use This?

- ✅ **Active maintenance** - Regular updates and bug fixes
- ✅ **Modern stack** - Full TypeScript codebase with Node.js 18+ support
- ✅ **Better performance** - Optimized scanning with 50-75% speed improvements
- ✅ **More reliable** - Comprehensive Jest test suite with high coverage
- ✅ **Feature-rich** - License validation, compliance checking, multiple output formats

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

# Example output:
# ├─ express@4.18.2
# │  ├─ licenses: MIT
# │  ├─ repository: https://github.com/expressjs/express
# │  └─ path: ./node_modules/express
# ├─ lodash@4.17.21
# │  ├─ licenses: MIT
# │  └─ path: ./node_modules/lodash
```

### Common Use Cases

```bash
# Export to JSON file
license-checker-evergreen --json --out licenses.json

# Find packages with unknown licenses
license-checker-evergreen --onlyunknown

# Check only production dependencies (skip devDependencies)
license-checker-evergreen --production

# Exclude common permissive licenses
license-checker-evergreen --excludeLicenses 'MIT;Apache-2.0;BSD-3-Clause'

# Fail build if GPL licenses found
license-checker-evergreen --failOn 'GPL;AGPL'

# Scan only direct dependencies (no sub-dependencies)
license-checker-evergreen --direct
```

## Table of Contents

- [Quick Start](#quick-start)
- [Output Formats](#output-formats)
- [CLI Options](#cli-options)
- [Programmatic Usage](#programmatic-usage)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License & Maintainers](#license--maintainers)

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

```json
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

```csv
module_name,licenses,repository,path
express@4.18.2,MIT,https://github.com/expressjs/express,./node_modules/express
lodash@4.17.21,MIT,,./node_modules/lodash
```

### Markdown Output

```bash
license-checker-evergreen --markdown
```

```markdown
- **express@4.18.2**
  - licenses: MIT
  - repository: https://github.com/expressjs/express

- **lodash@4.17.21**
  - licenses: MIT
```

## CLI Options

### Filtering Dependencies

| Option | Description |
|--------|-------------|
| `--production` | Show only production dependencies |
| `--development` | Show only development dependencies |
| `--direct` | Show only direct dependencies (no sub-dependencies) |
| `--depth [number]` | Limit dependency depth (e.g., `--depth 2`) |
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

- `--angularCli` - Synonym for `--plainVertical`
- `--clarificationsFile [filepath]` - License clarifications file (see [Clarifications](#clarifications))
- `--clarificationsMatchAll [boolean]` - Require all clarifications to be used
- `--csv` - Output in CSV format
- `--csvComponentPrefix` - Prefix column for component in CSV format
- `--customPath [filepath]` - Custom format file in JSON (see [Custom Format](#custom-format))
- `--depth [number]` - Dependency depth limit (overrides `--direct`)
- `--development` - Show only development dependencies
- `--direct [boolean|number]` - Show only direct dependencies or specific depth
- `--excludeLicenses [list]` - Exclude packages by license (comma-separated)
- `--excludePackages [list]` - Exclude specific packages (semicolon-separated)
- `--excludePackagesStartingWith [list]` - Exclude packages by prefix (comma-separated)
- `--excludePrivatePackages` - Exclude private packages
- `--failOn [list]` - Fail if these licenses found (semicolon-separated)
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

## Advanced Features

### License Clarifications

Override detected license information for specific packages using a clarifications file:

```bash
license-checker-evergreen --clarificationsFile clarifications.json
```

**clarifications.json:**
```json
{
    "package-name@1.0.0": {
        "licenses": "MIT",
        "licenseFile": "path/to/LICENSE",
        "licenseText": "Full license text...",
        "checksum": "sha256-hash-of-license-file",
        "licenseStart": "## License",
        "licenseEnd": "## End"
    }
}
```

**Features:**
- Use exact versions (`package@1.0.0`) or semver ranges (`package@^1.0.0`)
- Optional SHA-256 checksum to detect license changes
- Extract subregions of license files with `licenseStart`/`licenseEnd`
- Validate all clarifications are used with `--clarificationsMatchAll`

**Example with version ranges:**
```json
{
    "old-package@^1": {
        "licenses": "GPL-2.0"
    },
    "old-package@^2": {
        "licenses": "MIT"
    }
}
```

### Custom Output Format

Customize output fields and defaults using a JSON format file:

```bash
license-checker-evergreen --customPath custom-format.json --csv
```

**custom-format.json:**
```json
{
    "name": "",
    "version": "",
    "licenses": "",
    "repository": "",
    "licenseFile": "none",
    "licenseText": "none",
    "copyright": "",
    "email": "",
    "customField": "default value"
}
```

**Available fields:**
- `copyright` - Copyright holder information
- `description` - Package description
- `email` - Maintainer email
- `licenseFile` - Path to license file
- `licenseModified` - Whether license was modified
- `licenses` - License identifier(s)
- `licenseText` - Full license text
- `name` - Package name
- `publisher` - Package publisher
- `repository` - Repository URL
- `url` - Package URL
- `version` - Package version

**Notes:**
- CSV format: First column (`module_name`) is always included
- JSON format: Custom fields are merged with default output
- Avoid `licenseText` with Markdown format (produces very long output)

See [customFormatExample.json](customFormatExample.json) for a complete example.

### How License Detection Works

The tool uses a multi-step approach to identify licenses:

1. **SPDX Validation**: First checks `package.json` for valid [SPDX license identifiers](https://spdx.org/licenses/)
2. **File Scanning**: Searches for license files in this order:
   - `LICENSE` / `LICENCE`
   - `COPYING`
   - `README` files
3. **Pattern Matching**: Parses file contents against known license text patterns
4. **Marking**: Licenses detected from files (not package.json) are marked with `*`

**Supported License Formats:**
- SPDX identifiers (e.g., `MIT`, `Apache-2.0`)
- SPDX expressions (e.g., `MIT OR Apache-2.0`)
- Non-SPDX strings (e.g., `Public Domain`)

## Troubleshooting

### Common Issues

**Problem: "Unknown" licenses showing up**
```bash
# Find all unknown licenses
license-checker-evergreen --onlyunknown

# Solution: Use clarifications file to specify correct license
license-checker-evergreen --clarificationsFile clarifications.json
```

**Problem: Too many dependencies in output**
```bash
# Solution: Limit to production dependencies
license-checker-evergreen --production

# Or limit depth
license-checker-evergreen --depth 1
```

**Problem: Need to validate license compliance in CI/CD**
```bash
# Fail build if GPL licenses found
license-checker-evergreen --failOn 'GPL;AGPL;LGPL'

# Or allow only specific licenses
license-checker-evergreen --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause'
```

### Debug Mode

Enable detailed logging with the `DEBUG` environment variable:

```bash
# Show all debug output
DEBUG=license-checker-evergreen* license-checker-evergreen

# Show only errors
DEBUG=license-checker-evergreen:error license-checker-evergreen
```

### Getting Help

- Report issues: [GitHub Issues](https://github.com/greenstevester/license-checker-evergreen/issues)
- View examples: [customFormatExample.json](customFormatExample.json), [clarificationExample.json](clarificationExample.json)
- License resources: [ChooseALicense.com](https://choosealicense.com/), [TLDRLegal.com](https://tldrlegal.com/)

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

## License & Maintainers

### Current Maintainer

**[@greenstevester](https://github.com/greenstevester)** - Revamped the project with TypeScript, modern tooling, and performance improvements

### Project History

This is an actively maintained fork of the popular [license-checker](https://github.com/davglass/license-checker) by [@davglass](https://github.com/davglass).

**Previous Maintainers:**
- [@rseidelsohn](https://github.com/RSeidelsohn) - Maintained the project for many years, adding features and fixes
- [@davglass](https://github.com/davglass) - Original creator

### License

BSD-3-Clause - See [LICENSE.md](LICENSE.md)

---

## What's New

### Version 5.0.x (Current)

- ✅ **Full TypeScript migration** with type definitions
- ✅ **Jest testing framework** with comprehensive coverage
- ✅ **50-75% performance improvements** across all operations
- ✅ **Modern Node.js 18+** support with ES modules
- ✅ **Enhanced reliability** with modular test suite

### Version 4.x

- Added `--depth` option for dependency depth control
- Semver range support in clarifications file
- `--clarificationsMatchAll` option
- Multiple output format improvements

**[View Full Changelog →](CHANGELOG.md)** | **[View Releases →](https://github.com/greenstevester/license-checker-evergreen/releases)**
