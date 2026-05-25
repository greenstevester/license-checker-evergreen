import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

describe('bin/license-checker-evergreen', (): void => {
	test('should exit 0', (done): void => {
		const childProcess: ChildProcess = spawn(
			'node',
			[path.join(__dirname, '../dist/bin/license-checker-evergreen.js')],
			{
				cwd: path.join(__dirname, '../'),
				stdio: 'ignore',
			}
		);

		childProcess.on('exit', function (code: number | null): void {
			expect(code).toBe(0);
			done();
		});
	});

	// Regression for #20: --version was hardcoded to 6.0.0. Compare against
	// package.json so the assertion can't drift on future version bumps.
	test('--version reports the package.json version', (done): void => {
		const pkgVersion: string = JSON.parse(
			readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
		).version;

		const childProcess: ChildProcess = spawn(
			'node',
			[path.join(__dirname, '../dist/bin/license-checker-evergreen.js'), '--version'],
			{
				cwd: path.join(__dirname, '../'),
				stdio: ['ignore', 'pipe', 'pipe'],
			}
		);

		let output = '';
		childProcess.stdout?.on('data', (chunk): void => {
			output += chunk;
		});
		childProcess.stderr?.on('data', (chunk): void => {
			output += chunk;
		});

		childProcess.on('exit', function (): void {
			expect(output.trim()).toBe(pkgVersion);
			done();
		});
	});
});