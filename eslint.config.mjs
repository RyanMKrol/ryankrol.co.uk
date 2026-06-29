import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  // Don't lint build output, deps, coverage, or the standalone Node harness tooling under .harness/
  // (it's plain Node, not part of the Next app, so the next/core-web-vitals rules don't apply).
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'coverage/**', 'next-env.d.ts', '.harness/**'],
  },
  // Next.js' recommended rules (includes React + core-web-vitals).
  ...compat.extends('next/core-web-vitals'),
  // Jest globals for co-located test files, so describe/it/expect aren't no-undef.
  {
    files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'jest.setup.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
];

export default eslintConfig;
