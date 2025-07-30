import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
});