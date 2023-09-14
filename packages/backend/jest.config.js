// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  rootDir: 'tests',
  testEnvironment: path.join(__dirname, 'tests/__testEnv.js'),
  globalSetup: path.join(__dirname, 'tests/__globalSetup.js'),
  setupFiles: [
    path.join(__dirname, 'tests/__setupFiles__/mockSearchClient.js'),
  ],
  // globalTeardown: path.join(__dirname, 'tests/__globalTeardown.js'),
};
