/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '@jetbrains/youtrack-scripting-api/(.*)': '<rootDir>/tests/mocks/youtrack-api.mock.ts',
  },
  collectCoverageFrom: ['src/**/*.ts'],
};
