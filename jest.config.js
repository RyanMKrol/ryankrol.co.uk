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
  // The harness ships its own standalone *.test.js files (e.g. .harness/dashboard/lib.test.js) that
  // use Node's assert + a bespoke runner and call process.exit() — running them under jest crashes the
  // worker. They're run directly via `node`, not jest, so exclude the whole harness tree from collection.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.harness/'],
};

module.exports = createJestConfig(customJestConfig);
