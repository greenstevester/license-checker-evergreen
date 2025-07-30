import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

describe('bin/license-checker-evergreen', (): void => {
	test('should exit 1 if it finds a single license type (MIT) license due to --failOn MIT', (done): void => {
		const childProcess: ChildProcess = spawn(
			'node',
			[path.join(__dirname, '../dist/bin/license-checker-evergreen.js'), '--failOn', 'MIT'],
			{
				cwd: path.join(__dirname, '../'),
				stdio: 'ignore',
			}
		);

		childProcess.on('exit', (code: number | null): void => {
			expect(code).toBe(1);
			done();
		});
	});

	test('should exit 1 if it finds forbidden licenses license due to --failOn MIT;ISC', (done): void => {
		const childProcess: ChildProcess = spawn(
			'node',
			[path.join(__dirname, '../dist/bin/license-checker-evergreen.js'), '--failOn', 'MIT;ISC'],
			{
				cwd: path.join(__dirname, '../'),
				stdio: 'ignore',
			}
		);

		childProcess.on('exit', (code: number | null): void => {
			expect(code).toBe(1);
			done();
		});
	});

	test('should give warning about commas if --failOn MIT,ISC is provided', (done): void => {
		const proc: ChildProcess = spawn(
			'node',
			[path.join(__dirname, '../dist/bin/license-checker-evergreen.js'), '--failOn', 'MIT,ISC'],
			{
				cwd: path.join(__dirname, '../'),
				stdio: 'pipe',
			}
		);

		let stderr = '';

		if (proc.stdout) {
			proc.stdout.on('data', (): void => {});
		}

		if (proc.stderr) {
			proc.stderr.on('data', (data: Buffer): void => {
				stderr += data.toString();
			});
		}

		proc.on('close', (): void => {
			expect(
				stderr.indexOf('--failOn argument takes semicolons as delimeters instead of commas') >= 0
			).toBe(true);
			done();
		});
	});
});