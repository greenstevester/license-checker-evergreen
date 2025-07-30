import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { spawnSync as spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('bin/license-checker-evergreen', () => {

    test('should restrict the output to the provided packages', () => {
        const restrictedPackages = ['@types/node@24.1.0'];
        const output = spawn(
            'node',
            [
                path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
                '--json',
                '--includePackages',
                restrictedPackages.join(';'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            },
        );

        console.log(output.stderr.toString());
        expect(Object.keys(JSON.parse(output.stdout.toString()))).toEqual(restrictedPackages);
    });

    test('should exclude provided excludedPackages from the output', () => {
        const excludedPackages = ['@types/node@15.0.1', 'spdx-satisfies@5.0.0', 'y18n@3.2.1'];
        const output = spawn(
            'node',
            [
                path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
                '--json',
                '--excludePackages',
                excludedPackages.join(';'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            },
        );

        const packages = Object.keys(JSON.parse(output.stdout.toString()));
        excludedPackages.forEach((pkg) => {
            expect(packages.includes(pkg)).toBe(false);
        });
    });

    test('should exclude packages starting with', () => {
        const excludedPackages = ['@types', 'spdx'];
        const output = spawn(
            'node',
            [
                path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
                '--json',
                '--excludePackagesStartingWith',
                excludedPackages.join(';'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            },
        );

        const packages = Object.keys(JSON.parse(output.stdout.toString()));

        let illegalPackageFound = false;

        // Loop through all packages and check if they start with one of the excluded packages
        packages.forEach((p) => {
            excludedPackages.forEach((excludedPackage) => {
                if (p.startsWith(excludedPackage)) {
                    illegalPackageFound = true;
                }
            });
        });

        // If an illegal package was found, the test fails
        expect(illegalPackageFound).toBe(false);
    });


    test('should combine various types of inclusion and exclusions', () => {
        const excludedPrefix = ['@types', 'spdx'];
        const excludedNames = ['rimraf'];
        const output = spawn(
            'node',
            [
                path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
                '--json',
                '--excludePackages',
                excludedNames.join(';'),
                '--excludePackagesStartingWith',
                excludedPrefix.join(';'),
            ],
            {
                cwd: path.join(__dirname, '../'),
            },
        );
        const packages = Object.keys(JSON.parse(output.stdout.toString()));

        let illegalPackageFound = false;

        packages.forEach((p) => {
            excludedNames.forEach((pkgName) => {
                if(pkgName.indexOf('@')>1){
                    // check for the exact version
                    if(p === pkgName) illegalPackageFound = true;
                } else if (p.startsWith(`${pkgName}@`)) {
                    illegalPackageFound = true;
                }
            });
            excludedPrefix.forEach((prefix) => {
                if (p.startsWith(prefix)) {
                    illegalPackageFound = true;
                }
            });
        });

        // If an illegal package was found, the test fails
        expect(illegalPackageFound).toBe(false);
    });

    test('should exclude private packages from the output', () => {
        const output = spawn(
            'node',
            [path.join(__dirname, '../dist/bin/license-checker-evergreen.js'), '--json', '--excludePrivatePackages'],
            {
                cwd: path.join(__dirname, 'fixtures', 'privateModule'),
            },
        );

        const packages = Object.keys(JSON.parse(output.stdout.toString()));
        expect(packages.length).toBe(0);
    });
});
