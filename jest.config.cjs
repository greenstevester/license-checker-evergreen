module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.js',
    '!**/tests/setup.js'
  ],
  testTimeout: 10000,
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.jsx?$': ['ts-jest', {
      useESM: true
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|spdx-.*|read-installed-packages)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};