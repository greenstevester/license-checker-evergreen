module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.ts',
    '!**/tests/setup.ts'
  ],
  testTimeout: 120000,
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.jsx?$': ['ts-jest', {
      useESM: true
    }],
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|spdx-.*|read-installed-packages)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};