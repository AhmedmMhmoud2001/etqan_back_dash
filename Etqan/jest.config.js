/** Jest config for Etqan API integration tests */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
};
