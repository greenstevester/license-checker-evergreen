import { fileURLToPath } from 'url';
import { dirname } from 'path';
import assert from 'assert';

// Make __dirname available in ES modules
global.__dirname = dirname(fileURLToPath(import.meta.url));

// Make assert available globally for compatibility
global.assert = assert;