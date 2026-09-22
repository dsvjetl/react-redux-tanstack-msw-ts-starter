import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import vitestPlugin from 'eslint-plugin-vitest';

export default [
  // Build output, native project and generated assets are never linted
  {
    ignores: [
      'dist',
      'android',
      'coverage',
      'public',
      'plop-templates',
      'node_modules',
    ],
  },

  // TypeScript rules (recommended, non type-checked for speed)
  ...tseslint.configs.recommended,

  // Shared configuration for all JavaScript and TypeScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      vitest: vitestPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'prettier/prettier': 'error',
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          allowSeparatedGroups: true,
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules (e.g., fs, path)
            'external', // Dependencies from node_modules
            'internal', // Internal project imports
          ],
          'newlines-between': 'always', // Ensure newline between groups
          alphabetize: { order: 'ignore', caseInsensitive: true },
        },
      ],
      ...vitestPlugin.configs.recommended.rules,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },

  // Node-based config files
  {
    files: ['*.config.{js,ts,cjs}', 'plopfile.cjs', 'vitest.setup.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // Test-specific configuration
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'vitest/expect-expect': ['warn', { assertFunctionNames: ['expect'] }],
    },
  },
];
