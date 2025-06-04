module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  moduleNameMapper: {
    '^../models/userModel$': '<rootDir>/__tests__/__mocks__/userModel.js'
  }
}; 