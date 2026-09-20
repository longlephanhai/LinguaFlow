// Jest config for e2e tests (supertest)
/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@linguaflow/shared-types(.*)$': '<rootDir>/../../packages/shared-types/src$1',
  },
};
