import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('bin/license-checker-evergreen', () => {
    test('should exit 1 if it finds a single license type (MIT) license due to --failOn MIT', (done) => {
        spawn('node', [path.join(__dirname, '../bin/license-checker-evergreen'), '--failOn', 'MIT'], {
            cwd: path.join(__dirname, '../'),
            stdio: 'ignore',
        }).on('exit', (code) => {
            expect(code).toBe(1);
            done();
        });
    });

    test('should exit 1 if it finds forbidden licenses license due to --failOn MIT;ISC', (done) => {
        spawn('node', [path.join(__dirname, '../bin/license-checker-evergreen'), '--failOn', 'MIT;ISC'], {
            cwd: path.join(__dirname, '../'),
            stdio: 'ignore',
        }).on('exit', (code) => {
            expect(code).toBe(1);
            done();
        });
    });

    test('should give warning about commas if --failOn MIT,ISC is provided', (done) => {
        const proc = spawn('node', [path.join(__dirname, '../bin/license-checker-evergreen'), '--failOn', 'MIT,ISC'], {
            cwd: path.join(__dirname, '../'),
            stdio: 'pipe',
        });
        let stderr = '';
        proc.stdout.on('data', () => {});
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        proc.on('close', () => {
            expect(
                stderr.indexOf('--failOn argument takes semicolons as delimeters instead of commas') >= 0,
            ).toBe(true);
            done();
        });
    });
});
