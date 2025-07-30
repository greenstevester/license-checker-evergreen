module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '!**/__tests__/setup.ts'
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
    'node_modules/(?!(chalk|spdx-.*|read-installed-packages)/)',
    'dist/'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts']
};