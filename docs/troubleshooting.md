# Troubleshooting

[← Back to README](../README.md)

## Common Issues

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

## Debug Mode

Enable detailed logging with the `DEBUG` environment variable:

```bash
# Show all debug output
DEBUG=license-checker-evergreen* license-checker-evergreen

# Show only errors
DEBUG=license-checker-evergreen:error license-checker-evergreen
```

## Getting Help

- Report issues: [GitHub Issues](https://github.com/greenstevester/license-checker-evergreen/issues)
- View examples: [customFormatExample.json](customFormatExample.json), [clarificationExample.json](clarificationExample.json)
- License resources: [ChooseALicense.com](https://choosealicense.com/), [TLDRLegal.com](https://tldrlegal.com/)
