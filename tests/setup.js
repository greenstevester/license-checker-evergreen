import { fileURLToPath } from 'url';
import { dirname } from 'path';
import assert from 'assert';

// Make __dirname available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make assert available globally for compatibility
global.assert = assert;
global.__dirname = __dirname;