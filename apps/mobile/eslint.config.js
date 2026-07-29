// Flat ESLint config (ESLint 9), self-contained via typescript-eslint.
// We intentionally do NOT use eslint-config-expo here: it requires ESLint 9's
// `eslint/config` export, which collides with the monorepo root's pinned
// ESLint 8. Flat config also does not inherit the root's legacy `.eslintrc.js`,
// so this app lints in isolation from apps/web.
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'expo-env.d.ts',
      'scripts/*',
      '*.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        __DEV__: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // TypeScript handles undefined-symbol checking.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
