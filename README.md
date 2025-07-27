# License Checker Evergreen

> A feature-enhanced, actively maintained fork of the popular license-checker tool for extracting and analyzing NPM package licenses.

<img src="https://img.shields.io/npm/l/license-checker-evergreen" />

[![NPM](https://nodei.co/npm/license-checker-evergreen.png)](https://nodei.co/npm/license-checker-evergreen/)

**Key improvements over the original:**
- ✅ Active maintenance and regular updates
- ✅ Enhanced filtering and exclusion options  
- ✅ Modern Node.js support (18+)
- ✅ TypeScript support and improved reliability
- ✅ Jest testing framework with comprehensive coverage

## Quick Start

```shell
# Install globally
npm install -g license-checker-evergreen

# Scan your project
cd your-project
license-checker-evergreen

# Export to JSON
license-checker-evergreen --json > licenses.json

# Only show unknown licenses
license-checker-evergreen --onlyunknown
```

## Quick Reference

| Task | Command |
|------|---------|
| Basic scan | `license-checker-evergreen` |
| Export to JSON | `license-checker-evergreen --json > licenses.json` |
| Export to CSV | `license-checker-evergreen --csv --out licenses.csv` |
| Only show unknowns | `license-checker-evergreen --onlyunknown` |
| Exclude specific licenses | `license-checker-evergreen --excludeLicenses 'MIT,BSD'` |
| Show only direct deps | `license-checker-evergreen --direct` |

## Table of Contents

- [Installation & Usage](#quick-start)
- [Recent Changes](#changes)
- [Command Options](#all-options-in-alphabetical-order)
- [Examples](#examples)
- [Advanced Features](#clarifications)
- [Programmatic Usage](#requiring)
- [Troubleshooting](#debugging)
- [Maintainers](#maintainers)

## Example Output

When you run `license-checker-evergreen` in a project directory, you'll see output like this:

```ascii
├─ cli@0.4.3
│  ├─ repository: http://github.com/chriso/cli
│  └─ licenses: MIT
├─ glob@3.1.14
│  ├─ repository: https://github.com/isaacs/node-glob
│  └─ licenses: UNKNOWN
├─ jshint@0.9.1
│  └─ licenses: MIT
└─ yui-lint@0.1.1
   ├─ licenses: BSD
   └─ repository: http://github.com/yui/yui-lint
```

**Note:** An asterisk (`*`) next to a license name means it was detected from a LICENSE file rather than package.json:

```ascii
└─ debug@2.0.0
   ├─ repository: https://github.com/visionmedia/debug
   └─ licenses: MIT*
```

## <a id="changes"></a>Recent Changes

### Version 5.0.0 (Current)
- **TypeScript Migration**: Migrated entire codebase from JavaScript to TypeScript for improved reliability
- **Jest Testing**: Replaced jenkins-mocha with Jest testing framework for modern test suite
- **ES Module Support**: Enhanced ES module compatibility with proper TypeScript compilation
- **Build System**: Added comprehensive TypeScript build pipeline with type definitions

### Version 4.4.0
- feat: allow specifying ranges in clarifications file and add strict usage checking
- feat: Add new option `clarificationsMatchAll`
- chore: only include necessary files in package

### Version 4.3.0
- feat: Add numeric "--depth" option that overrides the ambiguous "--direct" option
- misc: Move from `require` to `import` in all the files

**[View complete changelog →](https://github.com/greenstevester/license-checker-evergreen/releases)**

## <a id="all_options_in_alphabetical_order"></a>All options in alphabetical order

-   `--angularCli` is just a synonym for `--plainVertical`
-   `--clarificationsFile [filepath]` A file that describe the license clarifications for each package, see clarificationExample.json, any field available to the customFormat option can be clarified. The clarifications file can also be used to specify a subregion of a package's license file (instead reading the entire file)
-   `--clarificationsMatchAll [boolean]` This optional new feature is still lacking a description - to be done
-   `--csv` output in csv format
-   `--csvComponentPrefix` prefix column for component in csv format
-   `--customPath` to add a custom Format file in JSON
-   `--depth [number]` look for "number" of levels of dependencies - overrides the ambiguously named "--direct" option'
-   `--development` only show development dependencies.
-   `--direct [boolean|number]` look for direct dependencies only if "true" or look for "number" of levels of dependencies
-   `--excludeLicenses [list]` exclude modules which licenses are in the comma-separated list from the output
-   `--excludePackages [list]` restrict output to the packages (either "package@fullversion" or "package@majorversion" or only "package") not in the semicolon-seperated list
-   `--excludePackagesStartingWith [list]` exclude modules which names start with the comma-separated list from the output (useful for excluding modules from a specific vendor and such). Example: `--excludePackagesStartingWith "webpack;@types;@babel"`
-   `--excludePrivatePackages` restrict output to not include any package marked as private
-   `--failOn [list]` fail (exit with code 1) on the first occurrence of the licenses of the semicolon-separated list
-   `--files [path]` copy all license files to path and rename them to `module-name`@`version`-LICENSE.txt
-   `--includeLicenses [list]` include only modules which licenses are in the comma-separated list from the output
-   `--includePackages [list]` restrict output to the packages (either "package@fullversion" or "package@majorversion" or only "package") in the semicolon-seperated list
-   `--json` output in json format
-   `--limitAttributes [list]` limit the attributes to be output
-   `--markdown` output in markdown format
-   `--nopeer` skip peer dependencies in output
-   `--onlyAllow [list]` fail (exit with codexclusionse 1) on the first occurrence of the licenses not in the semicolon-seperated list
-   `--onlyunknown` only list packages with unknown or guessed licenses
-   `--out [filepath]` write the data to a specific file
-   `--plainVertical` output license info in plain vertical format like [Angular CLI does](https://angular.io/3rdpartylicenses.txt)
-   `--production` only show production dependencies.
-   `--relativeLicensePath` output the location of the license files as relative paths
-   `--relativeModulePath` output the location of the module files as relative paths
-   `--start [filepath]` path of the initial json to look for
-   `--summary` output a summary of the license usage',
-   `--unknown` report guessed licenses as unknown licenses
-   `--version` The current version
-   `--help` The text you are reading right now :)

## <a id="exclusions"></a>Exclusions

A list of licenses is the simplest way to describe what you want to exclude.

You can use valid [SPDX identifiers](https://spdx.org/licenses/).
You can use valid SPDX expressions like `MIT OR X11`.
You can use non-valid SPDX identifiers, like `Public Domain`, since `npm` does
support some license strings that are not SPDX identifiers.

## <a id="examples"></a>Examples

```
license-checker-evergreen --json > /path/to/licenses.json
license-checker-evergreen --csv --out /path/to/licenses.csv
license-checker-evergreen --unknown
license-checker-evergreen --customPath customFormatExample.json
license-checker-evergreen --excludeLicenses 'MIT, MIT OR X11, BSD, ISC'
license-checker-evergreen --includePackages 'react@16.3.0;react-dom@16.3.0;lodash@4.3.1'
license-checker-evergreen --excludePackages 'internal-1;internal-2'
license-checker-evergreen --onlyunknown
```

## <a id="clarifications"></a>Clarifications

The `--clarificationsFile` option can be used to provide custom processing instructions on a per-package basis. The format is as so:

```json5
{
    "package_name@version": {
        // Any field available in customFormat can be clarified
        "licenses": "MIT",
        "licenseFile": "some/path",
        "licenseText": "The full text of the license to include if you need"
        // You can optionally add a SH-256 checksum of the license file contents that will be checked on each run. Intended to help detect when projects change their license.
        "checksum": "deadbeef...",
        // Add a licenseStart and optional licenseEnd to snip out a substring of the licenseText. The licenseStart will be included in the licenseText, the licenseEnd will not be.
        "licenseStart": "# MIT License",
        "licenseEnd": "=========",
    }
}
```

`version` can either be an exact version or a semver range, multiple ranges are supported for a single package, for example:

```json5
{
    "package_name@^1": {
        // Any field available in customFormat can be clarified
        "licenses": "GPL",
        // ... other fields, see above
    },
    "package_name@^2": {
        // Any field available in customFormat can be clarified
        "licenses": "MIT",
        // ... other fields, see above
    },
}
```

For overlapping ranges, the first matching entry is used.

The `--clarificationsMatchAll` option, when enabled, raises an error if not all specified clarifications were used, it is off by default.

<a name="custom_format"></a>

## Custom format

The `--customPath` option can be used with CSV to specify the columns. Note that
the first column, `module_name`, will always be used.

When used with JSON format, it will add the specified items to the usual ones.

The available items are the following:

-   copyright
-   description
-   email
-   licenseFile
-   licenseModified
-   licenses
-   licenseText
-   name
-   publisher
-   repository
-   url
-   version

You can also give default values for each item.
See an example in [customFormatExample.json](customFormatExample.json).

Note that outputting the license text is not recommended with Markdown formatting, as it can be very long and does not work well with Markdown lists.

## <a id="requiring"></a>Requiring

```js
var checker = require('license-checker-evergreen');

checker.init(
    {
        start: '/path/to/start/looking',
    },
    // eslint-disable-next-line no-unused-vars
    function (err, packages) {
        if (err) {
            //Handle error
        } else {
            //The sorted package data
            //as an Object
        }
    },
);
```

## <a id="debugging"></a>Debugging

license-checker uses [debug](https://www.npmjs.com/package/debug) for internal logging. There’s two internal markers:

-   `license-checker-evergreen:error` for errors
-   `license-checker-evergreen:log` for non-errors

Set the `DEBUG` environment variable to one of these to see debug output:

```shell
$ export DEBUG=license-checker-evergreen*; license-checker-evergreen
scanning ./yui-lint
├─ cli@0.4.3
│  ├─ repository: http://github.com/chriso/cli
│  └─ licenses: MIT
# ...
```

## <a id="all_options_in_alphabetical_order"></a>How Licenses are Found

We walk through the `node_modules` directory with the [`read-installed-packages`](https://www.npmjs.org/package/read-installed-packages) module. Once we gathered a list of modules we walk through them and look at all of their `package.json`'s, We try to identify the license with the [`spdx`](https://www.npmjs.com/package/spdx) module to see if it has a valid SPDX license attached. If that fails, we then look into the module for the following files: `LICENSE`, `LICENCE`, `COPYING`, & `README`.

If one of the those files are found (in that order) we will attempt to parse the license data from it with a list of known license texts. This will be shown with the `*` next to the name of the license to show that we "guessed" at it.

## <a id="related_information_sources_on_the_internet"></a>Related information sources on the internet

-   [ChooseALicense.com](https://choosealicense.com/) - aims at helping you in choosing an open source license for your project
-   [TLDRLegal.com](https://tldrlegal.com/) - aims at exlaining complicated legal details of software licenses in easy to understand english

---

## <a id="maintainers"></a>Maintainers

### Current Maintainer

**greenstevester** took over the project and renamed it to `license-checker-evergreen` - the project needed some TLC and that's what it got.

- 🚀 **Active Development**: Migrating to TypeScript, modern testing with Jest
- 🔧 **Regular Updates**: Bug fixes, security updates, and feature enhancements
- 📧 **Contact**: Open to contributions and feedback via GitHub issues

### Project History

This is a fork of davglass' [license-checker v.25.0.1](https://github.com/davglass/license-checker/releases/tag/v25.0.1). The original project wasn't being updated regularly, so this fork was created to add new features and fix bugs.

**Previous maintainer: rseidelsohn** - Thanks for the foundation and years of maintenance! The original maintainer message is preserved in the project history.

### Contributing

We welcome contributions! Feel free to:
- 🐛 Report bugs via GitHub issues
- 💡 Suggest new features 
- 🔧 Submit pull requests
- 📚 Improve documentation

**Requirements**: Node.js >=18, npm >=8
