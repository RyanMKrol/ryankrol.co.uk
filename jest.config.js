const nextJest = require('next/jest');

// Point next/jest at the app root so it loads next.config.js + .env files
// and applies the same SWC transform Next uses (JSX/ESM/CSS-module mocking).
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // jsdom so component/DOM tests work; pure-logic lib tests run fine here too.
  testEnvironment: 'jest-environment-jsdom',
  // Allow absolute-from-root imports if we ever add them.
  moduleDirectories: ['node_modules', '<rootDir>/'],
  // Only treat *.test.js / *.spec.js as tests (co-located next to source).
  testMatch: ['**/?(*.)+(test|spec).[jt]s?(x)'],
};

module.exports = createJestConfig(customJestConfig);
