const { pathsToModuleNameMapper } = require('ts-jest');

/** @type {import('jest').Config} */
module.exports = {
  displayName: 'web',
  preset: '../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@relay/anchor$': '<rootDir>/../anchor/src/index.ts',
    ...pathsToModuleNameMapper(
      {
        '@/*': ['web/*'],
      },
      { prefix: '<rootDir>/../' }
    ),
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
};
