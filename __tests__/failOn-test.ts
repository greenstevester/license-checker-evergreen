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

	// --- --spdxSemantics E2E tests (issue #2) ---

	const CLI = path.join(__dirname, '../dist/bin/license-checker-evergreen.js');
	const FIX = (name: string): string => path.join(__dirname, 'fixtures', name);
	const REPO_ROOT: string = path.join(__dirname, '../');

	type RunResult = { code: number | null; stdout: string; stderr: string };
	const run = (args: string[]): Promise<RunResult> =>
		new Promise((resolve) => {
			const proc: ChildProcess = spawn('node', [CLI, ...args], {
				cwd: REPO_ROOT,
				stdio: 'pipe',
			});
			let stdout = '';
			let stderr = '';
			proc.stdout?.on('data', (d: Buffer) => {
				stdout += d.toString();
			});
			proc.stderr?.on('data', (d: Buffer) => {
				stderr += d.toString();
			});
			proc.on('close', (code: number | null) => {
				resolve({ code, stdout, stderr });
			});
		});

	test('T1: --failOn GPL-2.0 --spdxSemantics fails on (BSD-3-Clause OR GPL-2.0)', async () => {
		const r = await run([
			'--failOn',
			'GPL-2.0',
			'--spdxSemantics',
			'--start',
			FIX('spdx-or-bsd-gpl'),
		]);
		expect(r.code).toBe(1);
		expect(r.stderr).toContain('(BSD-3-Clause OR GPL-2.0)');
	});

	test('T2: --failOn GPL-2.0 --spdxSemantics passes on (MIT OR Apache-2.0)', async () => {
		const r = await run([
			'--failOn',
			'GPL-2.0',
			'--spdxSemantics',
			'--json',
			'--start',
			FIX('spdx-or-mit-apache'),
		]);
		expect(r.code).toBe(0);
		expect(r.stdout).toContain('target-pkg@1.0.0');
	});

	test('T8: --failOn MIT (no flag) fails on MIT fixture (legacy regression)', async () => {
		const r = await run(['--failOn', 'MIT', '--start', FIX('spdx-mit')]);
		expect(r.code).toBe(1);
		expect(r.stderr).toContain('MIT');
	});

	test('T9: --failOn GPL-2.0 --spdxSemantics fails on (MIT AND GPL-2.0)', async () => {
		const r = await run([
			'--failOn',
			'GPL-2.0',
			'--spdxSemantics',
			'--start',
			FIX('spdx-and-mit-gpl'),
		]);
		expect(r.code).toBe(1);
		expect(r.stderr).toContain('(MIT AND GPL-2.0)');
	});

	test('T10: --failOn GPL-2.0 --spdxSemantics fails on (MIT OR (Apache-2.0 AND GPL-2.0))', async () => {
		const r = await run([
			'--failOn',
			'GPL-2.0',
			'--spdxSemantics',
			'--start',
			FIX('spdx-nested-or-and'),
		]);
		expect(r.code).toBe(1);
		expect(r.stderr).toContain('GPL-2.0');
	});

	test('--legacy --spdxSemantics emits stderr warning about no-op', async () => {
		const r = await run(['--legacy', '--spdxSemantics', '--start', FIX('spdx-mit')]);
		expect(r.stderr).toContain('--spdxSemantics has no effect under --legacy');
	});
});