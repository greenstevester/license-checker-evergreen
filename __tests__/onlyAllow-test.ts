import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

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

describe('bin/license-checker-evergreen --onlyAllow', (): void => {
	test('T3: --onlyAllow "MIT;ISC" --spdxSemantics passes on (MIT OR CC0-1.0)', async () => {
		const r = await run([
			'--onlyAllow',
			'MIT;ISC',
			'--spdxSemantics',
			'--json',
			'--start',
			FIX('spdx-or-mit-cc0'),
		]);
		expect(r.code).toBe(0);
		expect(r.stdout).toContain('target-pkg@1.0.0');
	});

	test('T4: --onlyAllow "MIT;ISC" --spdxSemantics rejects MIT-restricted-do-not-use', async () => {
		const r = await run([
			'--onlyAllow',
			'MIT;ISC',
			'--spdxSemantics',
			'--start',
			FIX('spdx-literal-custom'),
		]);
		expect(r.code).toBe(1);
		expect(r.stderr).toContain('MIT-restricted-do-not-use');
	});

	test('T5: --onlyAllow "MIT;ISC" --spdxSemantics rejects (MIT AND Apache-2.0)', async () => {
		const r = await run([
			'--onlyAllow',
			'MIT;ISC',
			'--spdxSemantics',
			'--start',
			FIX('spdx-and-mit-apache'),
		]);
		expect(r.code).toBe(1);
		expect(r.stderr).toContain('(MIT AND Apache-2.0)');
	});

	test('T6: --onlyAllow "MIT;ISC;Apache-2.0" --spdxSemantics accepts (MIT AND Apache-2.0)', async () => {
		const r = await run([
			'--onlyAllow',
			'MIT;ISC;Apache-2.0',
			'--spdxSemantics',
			'--json',
			'--start',
			FIX('spdx-and-mit-apache'),
		]);
		expect(r.code).toBe(0);
		expect(r.stdout).toContain('target-pkg@1.0.0');
	});

	test('T7: --onlyAllow MIT --spdxSemantics rejects UNKNOWN', async () => {
		const r = await run([
			'--onlyAllow',
			'MIT',
			'--spdxSemantics',
			'--start',
			FIX('spdx-unknown'),
		]);
		expect(r.code).toBe(1);
		expect(r.stderr).toContain('UNKNOWN');
	});

	test('T11: --onlyAllow MIT (no flag, legacy regression) passes on MIT fixture', async () => {
		const r = await run(['--onlyAllow', 'MIT', '--json', '--start', FIX('spdx-mit')]);
		expect(r.code).toBe(0);
		expect(r.stdout).toContain('target-pkg@1.0.0');
	});
});
