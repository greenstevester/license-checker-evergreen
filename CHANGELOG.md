# Changelog

## [6.0.0] - 2025-12-14

### 🚀 Features

### 🐛 Bug Fixes

### 🔧 Improvements
- bump version to 6.0.0 [skip ci]

### 📚 Documentation

### Other Changes




## [6.0.0] - 2025-12-14

### ⚠️ BREAKING CHANGES

This release removes deprecated and redundant CLI options. Users must update their scripts accordingly.

#### Removed Options

| Removed Option | Migration |
|----------------|-----------|
| `--direct` | Use `--depth` instead. `--depth 0` = direct dependencies only, `--depth 1` = one level deep, etc. |
| `--angularCli` | Use `--plainVertical` instead (identical functionality) |
| `--memoryOptimized` | Removed entirely (was undocumented and untested) |

#### Migration Examples

```bash
# Before (v5.x)
license-checker-evergreen --direct 0
license-checker-evergreen --direct true
license-checker-evergreen --angularCli

# After (v6.x)
license-checker-evergreen --depth 0
license-checker-evergreen              # no depth = all dependencies (Infinity)
license-checker-evergreen --plainVertical
```

### 🔧 Improvements

- Simplified argument parsing logic (removed ~60 lines of complex type coercion)
- Removed ~220 lines of duplicated memory-optimized code path
- Fixed typo in codebase (`angluarCli` → removed entirely)
- Updated dev dependencies to latest versions
- Updated production dependencies (chalk, debug, semver)

### 📚 Documentation

- Updated help text to clarify `--depth` usage

## [5.0.8] - 2025-10-11

### 🚀 Features

### 🐛 Bug Fixes

### 🔧 Improvements
- bump version to 5.0.8 [skip ci]

### 📚 Documentation

### Other Changes
- Merge pull request #6 from greenstevester/feature/vhs-cli-animations
- Merge pull request #5 from greenstevester/feature/vhs-cli-animations



## [5.0.7] - 2025-10-09

### 🚀 Features

### 🐛 Bug Fixes

### 🔧 Improvements
- bump version to 5.0.7 [skip ci]

### 📚 Documentation

### Other Changes




## [5.0.6] - 2025-10-09

### 🚀 Features

### 🐛 Bug Fixes

### 🔧 Improvements
- bump version to 5.0.6 [skip ci]
- bump version to 5.0.5 [skip ci]

### 📚 Documentation
- update CHANGELOG.md for v5.0.5

### Other Changes
- Update README.md



## [5.0.5] - 2025-10-05

### 🔧 Improvements
- bump version to 5.0.5 [skip ci]

## [5.0.4] - 2025-10-05

### 🔧 Improvements
- bump version to 5.0.4 [skip ci]

## [5.0.3] - 2025-10-05

### 🚀 Features
- add automated NPM download stats email reports

### 🐛 Bug Fixes
- version bump and package.json update
- version bump and package.json update

### 🔧 Improvements
- migrate email implementation from SendGrid to AWS SES

### 📚 Documentation
- add npm badges and optimize package.json for SEO
- comprehensive README improvements for better user onboarding
- update CHANGELOG.md for v5.0.2

### Other Changes
- Merge pull request #3 from greenstevester/readme-review-improvements
- fix(security): resolve ReDoS vulnerabilities in @octokit dependencies
- style(docs): add maintainer backstory and fix code formatting



## [5.0.2] - 2025-08-01

### 🚀 Features

### 🐛 Bug Fixes

### 🔧 Improvements

### 📚 Documentation
- clean up duplicate sections in CHANGELOG.md
- update CHANGELOG.md for v5.0.1
- update CHANGELOG.md with unreleased changes

### Other Changes




## [5.0.1] - 2025-07-31

### 🚀 Features
- complete main branch rebase and resolve ESLint errors
- convert all test files from JavaScript to TypeScript
- implement memory-efficient data structures with lazy evaluation and object pooling
- implement single-pass filtering to eliminate multiple data iterations
- convert synchronous I/O to async to unblock event loop
- implement license file caching to eliminate redundant I/O
- Add numeric "--depth" option that overrides the ambiguous "--direct" option fix: Fix local anchors in the README
- Add additional Apache version parser
- Use new 'limitAttributes' flag
- Add filterJson function to main program
- Add filterAttributes function for new limitAttributes flag
- Use new filter function
- Add new helper function for removing unwanted dependencies
- Use licenseFile paths with --files option
- Add support for detecting "unlicensed" modules

### 🐛 Bug Fixes
- completely restructure test suite for performance and reliability
- resolve test timeout errors and TypeError on string dependencies
- resolve test failures in clarificationFile-test.js and Jest configuration
- resolve Jest ES module configuration and test failures
- maintain legacy version as default for test compatibility
- methods from exports instead of global this
- Update read-installed-packages to 2.0.1
- Provide safe defaults for destructured argument object config: Decrease coverage requirements
- Fix `--relativeModulePath` using absolute paths when used with `--start`
- Fix relative path calculation
- Try to skip "license" URLs ending with image file name endings
- Fix function parameters to strings and add documentation
- Split helpers module in two files, so they can be required by two files
- Fix typo and remove TODO comment
- Fix the function for restricting to direct dependencies
- Revert arrow function to function expression
- Fix choosing the wrong license info
- Don't override custom licenses
- add failing test for custom license URL
- parse direct also inside init to make it work in programmatic usage
- markdown list format, fixes #43
- allow to combine `excludePackages` and `excludePackagesStartingWith` options
- Respect 'direct' option correctly

### 🔧 Improvements
- clean up obsolete JavaScript files from lib directory
- sync todo list and update Claude settings
- upgrade dependencies to latest versions and fix ESLint config
- only include necessary files in package
- Update nopt version from 5.0.0 to 7.2.0
- Use easier to understand functions and variable names
- Update contributors list
- Simplify and secure two helper functions
- Create helper function and use explicit node: in requires
- Extract a small functionality into a helper function
- Combine early return conditions
- Refactor and reorder constant and variable definitions
- Increase type safety and simplify code
- Move getCsvData and getCsvHeaders functions to index helpers
- Move getOptionArray function to index helpers
- Add a comment and increase type safety a bit
- Increase understandability of function
- Improve readability
- Increase fix version number
- Increase fix version number
- Rename regular expression constants and add one check
- Bump fix version
- Increase fix version number
- Add new contributors
- Provide a better name for a variable
- Move functionality into helpers and simplify exports
- Make code a bit safer
- Use a clearer argument name and provide a default value
- Move condition check after possible premature returns
- Provide a better name for the required index file.
- Extract functionality to helper module file
- Move getFirstNotUndefinedOrUndefined into helpers module file
- Extract functionality into helper functions
- Delete superfluous condition check
- Use a better argument name
- Extract function into helpers module file
- Move variable declarations inside the block they belong to
- Use a better name for the depth argument
- Increase fix version number in package.json
- Provide a better name for function argument
- Improve normalizing of "direct" argument and remove superfluous function
- Rename knownOpts to knownOptions and getParsedArgs to getParsedArguments
- Bring back alphabetical sort order to knownOpts params
- Use a better name for the json result from the checker
- Reorder imports and constants in the file's head
- Extract helper functions into separate module file
- Extract premature process exits and warnings into separate module file
- Extract usageMessage into separate file
- Directly use "clarifications" as property and value
- Provide a better name for a helper function
- Provide a better name for imported module function and its options
- Provide a better function name and move condition to function call
- Provide a better name for a helper function
- Transform snake case into camel case
- Provide better names for two constants
- Remove superfluous code
- Provide a better name for a function
- Provide better name and enhance functionality of helper function
- Provide a better name for the content of the current license file
- Provide a better name for the files variable
- Restrict scope of variable and provide a better name
- Give the key variable a better name
- Update version number from 4.1.1 to 4.2.0 in package.json
- Bump patch level
- Bump minor version
- Bump patch level
- fix typo
- Bump to new major version
- Update version
- Bump patch version
- Update contributor's list
- Bump minor version
- Bump fix version
- Replace deprecated function
- Bump major version
- Fix a typo and a missing comma
- bump to next version number
- Rename a lib file
- Make a snippet more readable

### 📚 Documentation
- update CHANGELOG.md with unreleased changes
- sync todo list with latest session progress
- Update CHANGELOG
- Update CHANGELOG
- Add changes to README
- Try to fix the markdown rendering glitch
- Add more documentation to a function
- Add latest change to README
- Update CHANGELOG
- Add description of changes in new version
- Create a changelog
- Make comment more explicit
- Add a few more comments to the code
- Improve the usage message
- Add description for the latest change
- Add description for the latest change
- Add change description for new fix version
- Add latest change info to README
- Update the version history in the README file
- Update the options usage description
- Fix contents of function description
- Improve warning message
- Add explanations for option values
- Update an outdated argument name in a function's documentation
- Add a todo note
- Add a TODO comment for future refactoring
- Add documentation helping with future refactorings
- Add a message from the maintainer to the README
- Update version history in README
- Update list of contributors
- Add "draft mode" notice to SECURITY.md
- Add missing changes info to README file
- Update changes in README
- Add documentation for new 'limitAttributes' flag
- Add "copyright" and order list alphabetically
- Add comment to function
- Document new feature
- Add new feature to docs
- Update contributors list
- Add info to README
- Remove travis-ci build status as it fails for whatever reason
- Order options alphabetically and refactor some minor functions
- Order command line options alphabetically and fix visual glitch

### Other Changes
- updated ci
- added new condition
- update node version
- added timeout
- small change
- updated lin
- before performance improvements
- partial syntax fixes completed
- Merge pull request #2 from greenstevester/readme-review
- Improve README user experience and organization
- updated and resolved tests
- Replace jenkins-mocha with Jest testing framework
- removed tool version
- Update TypeScript project configuration
- Sync todo list timestamp
- Update project todo list status
- Merge pull request #1 from greenstevester/convert-to-typescript
- Initial TypeScript conversion setup
- Remove accidentally duplicated array elements, change indentation and more
- Change 4 spaces indentation to tabs
- Update a few dependencies and add TS type definitions
- Change 4 spaces indentation to tabs
- Use refactored function names from imported "args.js"
- Add missing "depth" parameter and change indentation
- Refactor code
- Refactor code
- Add "use tabs" rule to the prettier configuration as well
- Delete an accidentally duplicated line
- Add .zed folder to .gitignore
- Change ESLint indentation rule from 4 spaces to tabs
- Apply prettier formatting
- Bump fix version
- Merge pull request #119 from kriths/master
- Fix path to executable
- Fix errors and update formatting
- Update new release description
- Fix copy&paste errors, update version & description
- Merge pull request #110 from ol-teuto/clarifications-semver
- Merge branch 'master' into clarifications-semver
- Merge pull request #106 from ol-teuto/slim-package
- Merge pull request #114 from RSeidelsohn/dependabot/npm_and_yarn/braces-3.0.3
 number
- Replace require with import all over the place
- Replace require with import all over the place
- chore(deps-dev): bump braces from 3.0.2 to 3.0.3
- Another try to fix the local markdown anchor tags
- Fix the broken local links in the README
- Merge pull request #108 from ArsArmandi/patch-1
- document clarifications file semver ranges
- allow specifying ranges in clarifications file and add strict usage checking for them
- Update indexHelpers.js
- Rename variable and compare with correct value
- Fix ts definition issue
- Merge pull request #100 from RSeidelsohn/dependabot/npm_and_yarn/babel/traverse-7.23.2
- chore(deps-dev): bump @babel/traverse from 7.21.5 to 7.23.2
- Merge pull request #99 from RSeidelsohn/release-4-2-10
- Merge branch 'master' into release-4-2-10
- WIP
- config: Add .tool-versions file
- Merge pull request #96 from chohner/fix_exports_methods
- test: Update tests after dependency updates
- Merge pull request #93 from Linko91/patch-1
- Merge pull request #81 from sportsracer/fix-programmatic-out-option
- Merge branch 'master' into fix-programmatic-out-option
- Merge pull request #86 from RSeidelsohn/dependabot/npm_and_yarn/semver-7.5.2
- Merge pull request #90 from RSeidelsohn/dependabot/npm_and_yarn/word-wrap-1.2.4
- updated "direct" type on index.d.ts
- chore(deps-dev): bump word-wrap from 1.2.3 to 1.2.4
- chore(deps): bump semver from 7.3.5 to 7.5.2
- Merge pull request #80 from RSeidelsohn/dependabot/npm_and_yarn/flat-and-jenkins-mocha-5.0.2
- Merge pull request #85 from RSeidelsohn/release_4.2.6
- Fix: Consider out option also when passed to programmatic interface
- chore(deps): bump flat and jenkins-mocha
- Merge pull request #79 from RSeidelsohn/dependabot/npm_and_yarn/yaml-2.2.2
- chore(deps): bump yaml from 2.2.1 to 2.2.2
- Merge pull request #76 from RSeidelsohn/release_4_2_5
- Merge pull request #75 from RSeidelsohn/release_4_2_4
- test: Let the URL check tests pass and add new test
- test: comment blocked test back in
- Merge pull request #74 from RSeidelsohn/release-4-2-2
- Merge pull request #73 from RSeidelsohn/release_4_2_1
- config: Lower the coverage limits for now
- style: Remove a surplus empty line
- style: Delete empty line between comment and code
- style: Convert snake case into camel case
- style: Move comment into a prettier-satisfying position
- test: Comment out url license test
- config: Add .vscode directory to .gitignore
- style: Ran prettier --fix
- style: Convert function declarations to arrow functions
- style: Use double quotes for string with single quote inside
- config: Increase editorconfig's indent size from 2 to 4
- Merge pull request #71 from Flydiverny/failing-test-custom-license
- Merge pull request #70 from Semigradsky/update-dependencies
- Merge pull request #66 from beawar/master
- Merge pull request #65 from marcobiedermann/patch-1
- style: Add missing whitespace
- Merge pull request #64 from zed-industries/clarifications-file-option
- Fixed ordering or command line arguments
- Fix type
- Added licenseStart and licenseEnd
- Fixed CLI help text
- Made checksum optional
- Fix dropped argument in flatten recursion
- Add a --clarificationFile option
- Merge pull request #62 from RSeidelsohn/release-4.1.1
- Merge pull request #60 from slhck/fix-markdown
- Merge pull request #59 from RSeidelsohn/release-3.1.0
- Merge pull request #58 from RSeidelsohn/release-3.1.0
- config: Allow npm versions higher than 8 as well
- Merge pull request #57 from RSeidelsohn/release-3.0.1
- Merge pull request #56 from Flydiverny/patch-2
- style: Add missing spaces
- Merge pull request #53 from RSeidelsohn/feature/new_major_release_4
- config: Add pre-commit file for husky
- build: Add husky for the pre-commit hook
- config: Add new prettier and lint tasks to our package.json file
- config: Add prettier to the ESlint configuration
- config: Add the tasks needed for lint-staged
- Add PrettierJS integration for ESlint and lint-staged
- style: Delete trailing spaces from file
- config: Remove outdated config option from .prettierrc
- config: Add directories to .prettierignore file
- config: Add an .eslintignore file
- config: Add NodeJS and npm version information to package.json
- config: Add an .editorconfig file to the project
- config: Update package-lock.json
- build: Require a NodeJS version of 18
- Merge pull request #52 from RSeidelsohn/develop
- build: Update package-lock.json file
- Merge pull request #50 from eugene1g/master
- bug: Fix node version in .nvmrc file
- Merge pull request #51 from RSeidelsohn/develop
- bug: Adjust node version to check for in test
- bug: Fix bug in excludePackagesStartingWith function
- build: Update minor and patch versions of dependencies and devdependencies
- Merge branch 'master' into develop
- Merge pull request #47 from cezaris13/patch-1
- Merge pull request #39 from Coada/patch-1
- Merge pull request #40 from Coada/patch-2
- Merge pull request #48 from rhl2401/master
- Merge pull request #1 from rhl2401/develop
- Update readme
- Removed excludePackagesEndingWith as it was unnecessary
- Updated requiring section
- Update getLicenseTitle.js
- Hippocratic License 2.1
- Exclude Licenses Example
- Add table of contents to the README
- Merge pull request #32 from RSeidelsohn/feature/0007_further-improvements
- config: Improve module description text
- test: Test new attributes filter functionality
- config: Decrease expected coverage percentages
- config: Add provisions for a future TS version of the project
- style: Reorder variables
- Merge pull request #31 from RSeidelsohn/feature/0006_fix-direct-option
- Merge pull request #30 from RSeidelsohn/feature/0005_adjust-license-file-path
- build: Add lodash.clonedeep module
- Merge pull request #29 from RSeidelsohn/features/0004_maintenance
- config: Add package-lock to repo
- test: Update tests for npm install
- build: Switch from yarn to npm
- Merge pull request #28 from RSeidelsohn/feature/0003_fix-tests
- test: Fix broken tests
- build: Update lockfile
- build: Increase node version
- Merge pull request #22 from Backfighter/patch-1
- Merge pull request #26 from d0b1010r/remove-console-log-failOn
- Merge pull request #25 from Semigradsky/master
- Remove console.log when failOn option is given
- Add `nopeer` option for ignoring peerDependencies. Add typings
- Indicate required node version
- Merge branch 'develop'
- Merge branch 'develop'
- Update dev-dependencies & fix duplicate entry in package.json
- config: Update dependencies

- Update dev-dependencies & fix duplicate entry in package.json
- config: Update dependencies
- Bump path-parse from 1.0.6 to 1.0.7
- config: Update lockfile and package.json
- config: Add license field to package.json
- config: Update lockfile and package.json
- config: Add license field to package.json
- config: Update fix version
- Merge pull request #13 from mehmetb/mehmetb/fix-relative-module-path
- Merge branch 'master' into mehmetb/fix-relative-module-path
- Update minor version
- Merge pull request #12 from mehmetb/mehmetb/fix-tests
- Merge branch 'master' into mehmetb/fix-tests
- conf: Update major version
- config: Remove babel-eslint
- style: Apply linter rules
- BREAKING CHANGE: Make unknown options exit license checker
- config: Adjust eslint rules
- Updated contributors in package.json
- Fixed relative module paths option
- Updated contributors in package.json
- Fixed a failing test
- Allow --files and --out options to be used simultaneously (WIP)
- Increase version
- Remove debugging output
- Print warning for unknown options passed to license-checker
- Upgrade dependencies
- Create new lockfile
- New Version: Update dependencies
- Fix index check and update tests
- Update dependencies and increase version number
- Merge pull request #8 from RSeidelsohn/feature/0002_create-plain-vertical-output
- Increase version number for new option
- Apply prettier formatting and use fixtures for new option test
- Apply prettier formatting and use const rather than var
- Update documentation and add --angularCli synonym for --plainVertical
- Add version information to module names for --plainVertical
- Apply prettier formatting
- Create SECURITY.md
- WIP: Add new option 'plainVertical'
- Apply prettier formatting rules
- Merge pull request #6 from RSeidelsohn/dependabot/npm_and_yarn/y18n-4.0.1
- Merge pull request #7 from RSeidelsohn/develop
- Update tests and start refactoring
- Upgrade dependencies to latest versions
- Bump y18n from 4.0.0 to 4.0.1
- Add config files for prettier, nvm and git
- Add PrettierJS as dev dependency
- Update dependencies
- Lower coverage affordances and fix tests
- Add link to the original release
- Update node modules
- Remove obsolete file
- Merge pull request #4 from gugu/patch-1
- Update license.js
- Support zero parity license for husky module
- Merge pull request #1 from RSeidelsohn/dependabot/npm_and_yarn/acorn-7.1.1
- Bump acorn from 7.1.0 to 7.1.1
- Update version
- Set up travis build process for the repository
- Update version number
- Remove obsolete message
- Update version
- Add new option `--relativeModulePath`
- Update the readme
- Refactor code, implement new features and fix minor issues


## [5.0.0] - 2025-07-30

### 🚀 Features
- complete master branch rebase and resolve ESLint errors
- convert all test files from JavaScript to TypeScript
- implement memory-efficient data structures with lazy evaluation and object pooling
- implement single-pass filtering to eliminate multiple data iterations
- convert synchronous I/O to async to unblock event loop
- implement license file caching to eliminate redundant I/O
- Add numeric "--depth" option that overrides the ambiguous "--direct" option fix: Fix local anchors in the README
- Add additional Apache version parser
- Use new 'limitAttributes' flag
- Add filterJson function to main program
- Add filterAttributes function for new limitAttributes flag
- Use new filter function
- Add new helper function for removing unwanted dependencies
- Use licenseFile paths with --files option
- Add support for detecting "unlicensed" modules

### 🐛 Bug Fixes
- resolve GitHub Actions release workflow push failures
- update CI workflow with complete allowed license list
- resolve TypeScript compilation errors
- completely restructure test suite for performance and reliability
- resolve JSON parsing error by removing aggressive monkey patch
- resolve TypeError in read-installed-packages library
- resolve test timeout errors and TypeError on string dependencies
- increase test timeouts to resolve dependency scanning timeouts
- resolve test failures in clarificationFile-test.js and Jest configuration
- resolve Jest ES module configuration and test failures
- maintain legacy version as default for test compatibility
- fixed failing tests
- Fix the broken direct attribute
- Revert breaking refactoring
- methods from exports instead of global this
- Fix wrong merge
- Remove broken husky for now
- Update read-installed-packages to 2.0.1
- Provide safe defaults for destructured argument object config: Decrease coverage requirements
- Fix `--relativeModulePath` using absolute paths when used with `--start`
- Fix relative path calculation
- Fix a sneaked in bug
- Fix a typo
- Try to skip "license" URLs ending with image file name endings
- Fix function parameters to strings and add documentation
- Fix typos
- Split helpers module in two files, so they can be required by two files
- Fix typo and remove TODO comment
- Fix the function for restricting to direct dependencies
- Correct a typo
- Revert arrow function to function expression
- Fix choosing the wrong license info
- Don't override custom licenses
- add failing test for custom license URL
- parse direct also inside init to make it work in programmatic usage
- markdown list format, fixes #43
- allow to combine `excludePackages` and `excludePackagesStartingWith` options
- Respect 'direct' option correctly
- Add missing comma
- Update lockfile
- Fix broken stuff after refactoring and update failing tests

### 🔧 Improvements
- finalize CI workflow and package.json scripts
- clean up obsolete JavaScript files from lib directory
- sync todo list and update Claude settings
- upgrade dependencies to latest versions and fix ESLint config
- only include necessary files in package
- Update nopt version from 5.0.0 to 7.2.0
- Use easier to understand functions and variable names
 and update changes
- Update contributors list
- Simplify and secure two helper functions
- Create helper function and use explicit node: in requires
- Extract a small functionality into a helper function
- Combine early return conditions
- Refactor and reorder constant and variable definitions
- Increase type safety and simplify code
- Move getCsvData and getCsvHeaders functions to index helpers
- Move getOptionArray function to index helpers
- Add a comment and increase type safety a bit
- Increase understandability of function
- Improve readability
- Increase fix version number
- Increase fix version number
- Rename regular expression constants and add one check
- Bump fix version
- Increase fix version number
- Add new contributors
- Provide a better name for a variable
- Move functionality into helpers and simplify exports
- Make code a bit safer
- Use a clearer argument name and provide a default value
- Move condition check after possible premature returns
- Provide a better name for the required index file.
- Extract functionality to helper module file
- Move getFirstNotUndefinedOrUndefined into helpers module file
- Extract functionality into helper functions
- Delete superfluous condition check
- Use a better argument name
- Extract function into helpers module file
- Move variable declarations inside the block they belong to
- Use a better name for the depth argument
- Increase fix version number in package.json
- Provide a better name for function argument
- Improve normalizing of "direct" argument and remove superfluous function
- Rename knownOpts to knownOptions and getParsedArgs to getParsedArguments
- Bring back alphabetical sort order to knownOpts params
- Use a better name for the json result from the checker
- Reorder imports and constants in the file's head
- Extract helper functions into separate module file
- Extract premature process exits and warnings into separate module file
- Extract usageMessage into separate file
- Directly use "clarifications" as property and value
- Provide a better name for a helper function
- Provide a better name for imported module function and its options
- Provide a better function name and move condition to function call
- Provide a better name for a helper function
- Transform snake case into camel case
- Provide better names for two constants
- Remove superfluous code
- Provide a better name for a function
- Provide better name and enhance functionality of helper function
- Provide a better name for the content of the current license file
- Provide a better name for the files variable
- Restrict scope of variable and provide a better name
- Give the key variable a better name
- Update version number from 4.1.1 to 4.2.0 in package.json
- Bump patch level
- Bump minor version
- Bump patch level
- fix typo
- Bump to new major version
- Update version
- Bump patch version
- Update contributor's list
- Bump minor version
- Bump fix version
- Replace deprecated function
- Bump major version
- Delete obsolete yarn.lock
- Fix a typo and a missing comma
- bump to next version number
- Rename a lib file
- Make a snippet more readable

### 📚 Documentation
- sync todo list with latest session progress
- Update CHANGELOG
- Update CHANGELOG
- Add changes to README
- Try to fix the markdown rendering glitch
- Add more documentation to a function
- Add latest change to README
- Update CHANGELOG
- Add description of changes in new version
- Create a changelog
- Make comment more explicit
- Add a few more comments to the code
- Improve the usage message
- Add description for the latest change
- Add description for the latest change
- Add change description for new fix version
- Add latest change info to README
- Update the version history in the README file
- Update the options usage description
- Fix contents of function description
- Improve warning message
- Add explanations for option values
- Update an outdated argument name in a function's documentation
- Add a todo note
- Add a TODO comment for future refactoring
- Add documentation helping with future refactorings
- Add a message from the maintainer to the README
- Update version history in README
- Update list of contributors
- Add "draft mode" notice to SECURITY.md
- Add missing changes info to README file
- Update changes in README
- Add documentation for new 'limitAttributes' flag
- Add "copyright" and order list alphabetically
- Add comment to function
- Document new feature
- Add new feature to docs
- Update contributors list
- Add info to README
- Remove travis-ci build status as it fails for whatever reason
- Order options alphabetically and refactor some minor functions
- Order command line options alphabetically and fix visual glitch

### Other Changes
- updated ci
- updated workflow
- added new condition
- update node version
- added git workflows
- added timeout
- small change
- updated lin
- before performance improvements
- partial syntax fixes completed
- Merge pull request #2 from greenstevester/readme-review
- Improve README user experience and organization
- updated and resolved tests
- Replace jenkins-mocha with Jest testing framework
- removed tool version
- Update TypeScript project configuration
- Sync todo list timestamp
- Update project todo list status
- Delete .github/workflows/npm-publish.yml
- Create npm-publish.yml
- Merge pull request #1 from greenstevester/convert-to-typescript
- Initial TypeScript conversion setup
- Remove accidentally duplicated array elements, change indentation and more
- Change 4 spaces indentation to tabs
- Update a few dependencies and add TS type definitions
- Change 4 spaces indentation to tabs
- Use refactored function names from imported "args.js"
- Add missing "depth" parameter and change indentation
- Refactor code
- Refactor code
- Add "use tabs" rule to the prettier configuration as well
- Delete an accidentally duplicated line
- Add .zed folder to .gitignore
- Change ESLint indentation rule from 4 spaces to tabs
- Apply prettier formatting
- Bump fix version
- Merge pull request #119 from kriths/master
- Fix path to executable
- Fix errors and update formatting
- Update new release description
- Fix copy&paste errors, update version & description
- Merge pull request #110 from ol-teuto/clarifications-semver
- Merge branch 'master' into clarifications-semver
- Merge pull request #106 from ol-teuto/slim-package
- Merge pull request #114 from RSeidelsohn/dependabot/npm_and_yarn/braces-3.0.3
 number
- Replace require with import all over the place
- Replace require with import all over the place
- chore(deps-dev): bump braces from 3.0.2 to 3.0.3
- Another try to fix the local markdown anchor tags
- Fix the broken local links in the README
- Merge pull request #108 from ArsArmandi/patch-1
- document clarifications file semver ranges
- allow specifying ranges in clarifications file and add strict usage checking for them
- Update indexHelpers.js
- Rename variable and compare with correct value
- Fix ts definition issue
- Merge pull request #100 from RSeidelsohn/dependabot/npm_and_yarn/babel/traverse-7.23.2
- chore(deps-dev): bump @babel/traverse from 7.21.5 to 7.23.2
- Merge pull request #99 from RSeidelsohn/release-4-2-10
- Merge branch 'master' into release-4-2-10
- config: Add .tool-versions file
- Merge pull request #96 from chohner/fix_exports_methods
- test: Update tests after dependency updates
- Merge pull request #93 from Linko91/patch-1
- Merge pull request #81 from sportsracer/fix-programmatic-out-option
- Merge branch 'master' into fix-programmatic-out-option
- Merge pull request #86 from RSeidelsohn/dependabot/npm_and_yarn/semver-7.5.2
- Merge pull request #90 from RSeidelsohn/dependabot/npm_and_yarn/word-wrap-1.2.4
- updated "direct" type on index.d.ts
- chore(deps-dev): bump word-wrap from 1.2.3 to 1.2.4
- chore(deps): bump semver from 7.3.5 to 7.5.2
- Merge pull request #80 from RSeidelsohn/dependabot/npm_and_yarn/flat-and-jenkins-mocha-5.0.2
- Merge pull request #85 from RSeidelsohn/release_4.2.6
- Fix: Consider out option also when passed to programmatic interface
- chore(deps): bump flat and jenkins-mocha
- Merge pull request #79 from RSeidelsohn/dependabot/npm_and_yarn/yaml-2.2.2
- chore(deps): bump yaml from 2.2.1 to 2.2.2
- Merge pull request #76 from RSeidelsohn/release_4_2_5
- Merge pull request #75 from RSeidelsohn/release_4_2_4
- test: Let the URL check tests pass and add new test
- test: comment blocked test back in
- Merge pull request #74 from RSeidelsohn/release-4-2-2
- Merge pull request #73 from RSeidelsohn/release_4_2_1
- config: Lower the coverage limits for now
- style: Remove a surplus empty line
- style: Delete empty line between comment and code
- style: Convert snake case into camel case
- style: Move comment into a prettier-satisfying position
- test: Comment out url license test
- config: Add .vscode directory to .gitignore
- style: Ran prettier --fix
- style: Convert function declarations to arrow functions
- style: Use double quotes for string with single quote inside
- config: Increase editorconfig's indent size from 2 to 4
- Merge pull request #71 from Flydiverny/failing-test-custom-license
- Merge pull request #70 from Semigradsky/update-dependencies
- Merge pull request #66 from beawar/master
- Merge pull request #65 from marcobiedermann/patch-1
- style: Add missing whitespace
- Merge pull request #64 from zed-industries/clarifications-file-option
- Fixed ordering or command line arguments
- Fix type
- Added licenseStart and licenseEnd
- Fixed CLI help text
- Made checksum optional
- Fix dropped argument in flatten recursion
- Add a --clarificationFile option
- Merge pull request #62 from RSeidelsohn/release-4.1.1
- Merge pull request #60 from slhck/fix-markdown
- Merge pull request #59 from RSeidelsohn/release-3.1.0
- Merge pull request #58 from RSeidelsohn/release-3.1.0
- config: Allow npm versions higher than 8 as well
- Merge pull request #57 from RSeidelsohn/release-3.0.1
- Merge pull request #56 from Flydiverny/patch-2
- style: Add missing spaces
- Merge pull request #53 from RSeidelsohn/feature/new_major_release_4
- config: Add pre-commit file for husky
- build: Add husky for the pre-commit hook
- config: Add new prettier and lint tasks to our package.json file
- config: Add prettier to the ESlint configuration
- config: Add the tasks needed for lint-staged
- Add PrettierJS integration for ESlint and lint-staged
- style: Delete trailing spaces from file
- config: Remove outdated config option from .prettierrc
- config: Add directories to .prettierignore file
- config: Add an .eslintignore file
- config: Add NodeJS and npm version information to package.json
- config: Add an .editorconfig file to the project
- config: Update package-lock.json
- build: Require a NodeJS version of 18
- Merge pull request #52 from RSeidelsohn/develop
- build: Update package-lock.json file
- Merge pull request #50 from eugene1g/master
- bug: Fix node version in .nvmrc file
- Merge pull request #51 from RSeidelsohn/develop
- bug: Adjust node version to check for in test
- bug: Fix bug in excludePackagesStartingWith function
- build: Update minor and patch versions of dependencies and devdependencies
- Merge branch 'master' into develop
- Merge pull request #47 from cezaris13/patch-1
- Merge pull request #39 from Coada/patch-1
- Merge pull request #40 from Coada/patch-2
- Merge pull request #48 from rhl2401/master
- Merge pull request #1 from rhl2401/develop
- Update readme
- Removed excludePackagesEndingWith as it was unnecessary
- Finish up
- Remove console.log
- Added excludePackagesStartingWith
- Added args
- npm audit fix
- p.lock
- Updated requiring section
- Update getLicenseTitle.js
- Hippocratic License 2.1
- Exclude Licenses Example
- Add table of contents to the README
- Merge pull request #32 from RSeidelsohn/feature/0007_further-improvements
- config: Improve module description text
- test: Test new attributes filter functionality
- config: Decrease expected coverage percentages
- config: Add provisions for a future TS version of the project
- style: Reorder variables
- Merge pull request #31 from RSeidelsohn/feature/0006_fix-direct-option
- Merge pull request #30 from RSeidelsohn/feature/0005_adjust-license-file-path
- build: Add lodash.clonedeep module
- Merge pull request #29 from RSeidelsohn/features/0004_maintenance
- config: Add package-lock to repo
- test: Update tests for npm install
- build: Switch from yarn to npm
- Merge pull request #28 from RSeidelsohn/feature/0003_fix-tests
- test: Fix broken tests
- build: Update lockfile
- build: Increase node version
- Merge pull request #22 from Backfighter/patch-1
- Merge pull request #26 from d0b1010r/remove-console-log-failOn
- Merge pull request #25 from Semigradsky/master
- Remove console.log when failOn option is given
- Add `nopeer` option for ignoring peerDependencies. Add typings
- Indicate required node version
- Merge branch 'develop'
- Merge branch 'develop'
- Update dev-dependencies & fix duplicate entry in package.json
- config: Update dependencies

- Update dev-dependencies & fix duplicate entry in package.json
- config: Update dependencies
- Bump path-parse from 1.0.6 to 1.0.7
- config: Update lockfile and package.json
- config: Add license field to package.json
- config: Update lockfile and package.json
- config: Add license field to package.json
- Update npmpublish.yml
- Update npmpublish.yml
- config: Update fix version
- Merge pull request #13 from mehmetb/mehmetb/fix-relative-module-path
- Merge branch 'master' into mehmetb/fix-relative-module-path
- Update minor version
- Merge pull request #12 from mehmetb/mehmetb/fix-tests
- Merge branch 'master' into mehmetb/fix-tests
- conf: Update major version
- config: Remove babel-eslint
- style: Apply linter rules
- BREAKING CHANGE: Make unknown options exit license checker
- config: Adjust eslint rules
- Updated contributors in package.json
- Fixed relative module paths option
- Updated contributors in package.json
- Fixed a failing test
- Allow --files and --out options to be used simultaneously (WIP)
- Increase version
- Remove debugging output
- Print warning for unknown options passed to license-checker
- Upgrade dependencies
- Create new lockfile
- New Version: Update dependencies
- Fix index check and update tests
- Update dependencies and increase version number
- Merge pull request #8 from RSeidelsohn/feature/0002_create-plain-vertical-output
- Increase version number for new option
- Apply prettier formatting and use fixtures for new option test
- Apply prettier formatting and use const rather than var
- Update documentation and add --angularCli synonym for --plainVertical
- Add version information to module names for --plainVertical
- Apply prettier formatting
- Create SECURITY.md
- WIP: Add new option 'plainVertical'
- Apply prettier formatting rules
- Create codeql-analysis.yml
- Merge pull request #6 from RSeidelsohn/dependabot/npm_and_yarn/y18n-4.0.1
- Merge pull request #7 from RSeidelsohn/develop
- Update tests and start refactoring
- Upgrade dependencies to latest versions
- Bump y18n from 4.0.0 to 4.0.1
- Add config files for prettier, nvm and git
- Add PrettierJS as dev dependency
- Update dependencies
- Lower coverage affordances and fix tests
- Add link to the original release
- Update node modules
- Remove obsolete file
- Merge pull request #4 from gugu/patch-1
- Update license.js
- Support zero parity license for husky module
- Merge pull request #1 from RSeidelsohn/dependabot/npm_and_yarn/acorn-7.1.1
- Bump acorn from 7.1.0 to 7.1.1
- Update version
- Set up travis build process for the repository
- Update version number
- Remove obsolete message
- Update version
- Add new option `--relativeModulePath`
- Update the readme
- Refactor code, implement new features and fix minor issues
