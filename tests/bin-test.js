import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('bin/license-checker-evergreen', () => {
    test('should exit 0', (done) => {
        spawn('node', [path.join(__dirname, '../bin/license-checker-evergreen')], {
            cwd: path.join(__dirname, '../'),
            stdio: 'ignore',
        }).on('exit', function (code) {
            expect(code).toBe(0);
            done();
        });
    });
});
