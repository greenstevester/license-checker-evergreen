import { fileURLToPath } from 'url';
import { dirname } from 'path';
import assert from 'assert';

// Make __dirname available in ES modules
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

// Extend global object with Jest globals and custom properties
declare global {
	// eslint-disable-next-line no-var
	var assert: typeof import('assert');
	// eslint-disable-next-line no-var
	var __dirname: string;
}

// Make assert available globally for compatibility
global.assert = assert;
global.__dirname = __dirname;