import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { spawnSync as spawn, SpawnSyncReturns } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

describe('bin/license-checker-evergreen', (): void => {
	test('should restrict the output to the provided packages', (): void => {
		const restrictedPackages: string[] = ['@types/node@22.17.0'];
		const output: SpawnSyncReturns<Buffer> = spawn(
			'node',
			[
				path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
				'--json',
				'--includePackages',
				restrictedPackages.join(';'),
			],
			{
				cwd: path.join(__dirname, '../'),
			}
		);

		console.log(output.stderr.toString());
		expect(Object.keys(JSON.parse(output.stdout.toString()))).toEqual(restrictedPackages);
	});

	test('should exclude provided excludedPackages from the output', (): void => {
		const excludedPackages: string[] = ['@types/node@15.0.1', 'spdx-satisfies@5.0.0', 'y18n@3.2.1'];
		const output: SpawnSyncReturns<Buffer> = spawn(
			'node',
			[
				path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
				'--json',
				'--excludePackages',
				excludedPackages.join(';'),
			],
			{
				cwd: path.join(__dirname, '../'),
			}
		);

		const packages: string[] = Object.keys(JSON.parse(output.stdout.toString()));
		excludedPackages.forEach((pkg: string): void => {
			expect(packages.includes(pkg)).toBe(false);
		});
	});

	test('should exclude packages starting with', (): void => {
		const excludedPackages: string[] = ['@types', 'spdx'];
		const output: SpawnSyncReturns<Buffer> = spawn(
			'node',
			[
				path.join(__dirname, '../dist/bin/license-checker-evergreen.js'),
				'--json',
				'--excludePackagesStartingWith',
				excludedPackages.join(';'),
			],
			{
				cwd: path.join(__dirname, '../'),
			}
		);

		const packages: string[] = Object.keys(JSON.parse(output.stdout.toString()));

		let illegalPackageFound = false;

		// Loop through all packages and check if they start with one of the excluded packages
		packages.forEach((p: string): void => {
			excludedPackages.forEach((excludedPackage: string): void => {
				if (p.startsWith(excludedPackage)) {
					illegalPackageFound = true;
				}
			});
		});

		// If an illegal package was found, the test fails
		expect(illegalPackageFound).toBe(false);
	});

	test('should combine various types of inclusion and exclusions', (): void => {
		const excludedPrefix: string[] = ['@types', 'spdx'];
		const excludedNames: string[] = ['rimraf'];
		const output: SpawnSyncReturns<Buffer> = spawn(
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
			}
		);
		const packages: string[] = Object.keys(JSON.parse(output.stdout.toString()));

		let illegalPackageFound = false;

		packages.forEach((p: string): void => {
			excludedNames.forEach((pkgName: string): void => {
				if (pkgName.indexOf('@') > 1) {
					// check for the exact version
					if (p === pkgName) illegalPackageFound = true;
				} else if (p.startsWith(`${pkgName}@`)) {
					illegalPackageFound = true;
				}
			});
			excludedPrefix.forEach((prefix: string): void => {
				if (p.startsWith(prefix)) {
					illegalPackageFound = true;
				}
			});
		});

		// If an illegal package was found, the test fails
		expect(illegalPackageFound).toBe(false);
	});

	test('should exclude private packages from the output', (): void => {
		const output: SpawnSyncReturns<Buffer> = spawn(
			'node',
			[path.join(__dirname, '../dist/bin/license-checker-evergreen.js'), '--json', '--excludePrivatePackages'],
			{
				cwd: path.join(__dirname, 'fixtures', 'privateModule'),
			}
		);

		const packages: string[] = Object.keys(JSON.parse(output.stdout.toString()));
		expect(packages.length).toBe(0);
	});
});