// @ts-check
/**
 * Single ESLint configuration for the whole monorepo: per-package configs always drift apart.
 * Every rule below is explained in docs/engineering/CODING_STANDARDS.md, section 4.
 * Formatting is Prettier's job: no formatting rule is enabled here.
 */
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/coverage/',
    '**/playwright-report/',
    '**/test-results/',
    'tools/templates/',
  ]),

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
  },

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  comments.recommended,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Size and complexity: beyond these limits, split the code.
      complexity: ['error', 12],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],

      // Classic correctness rules.
      eqeqeq: ['error', 'always'],
      'no-console': 'error',
      'prefer-const': 'error',

      // Erasable TypeScript only (Node runs tools without transpilation); unions instead of enums.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a union of string literals or an `as const` object instead of an enum.',
        },
        {
          selector: 'TSModuleDeclaration[kind="namespace"]',
          message: 'Use ES modules instead of namespaces.',
        },
      ],

      // Named exports only: reliable renames and tree shaking.
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],

      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',

      // Every lint exception must say why.
      '@eslint-community/eslint-comments/require-description': 'error',
    },
  },

  // JavaScript files (configuration files): no type information.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },

  // Tooling runs in Node and reports on the console.
  {
    files: ['tools/**/*.ts', '*.config.{js,ts}', '**/*.cjs'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },

  // Tools require a default export from their configuration file.
  {
    files: ['*.config.{js,ts}'],
    rules: { 'no-restricted-exports': 'off' },
  },

  // Tests: long `describe` blocks are expected.
  {
    files: ['**/*.test.{ts,tsx}', '**/*.test-d.ts'],
    rules: { 'max-lines-per-function': 'off' },
  },
);
