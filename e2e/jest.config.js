const { DetoxCircusEnvironment, SpecReporter, WorkerAssignReporter } = require('detox/runners/jest');

const config = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'e2e/reports', outputName: 'junit.xml' }],
    new SpecReporter({ stacktrace: true }),
    new WorkerAssignReporter(),
  ],
  testEnvironment: DetoxCircusEnvironment.default,
  testEnvironmentOptions: {
    eventListeners: [
      new WorkerAssignReporter(),
    ],
  },
  verbose: true,
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
};

module.exports = config;
