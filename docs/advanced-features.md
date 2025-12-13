# Advanced Features

[← Back to README](../README.md)

## License Clarifications

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

## Custom Output Format

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

See [customFormatExample.json](../customFormatExample.json) for a complete example.

## How License Detection Works

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
