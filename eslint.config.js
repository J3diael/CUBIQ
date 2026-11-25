// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Generated files: the scramble engine bundle and drizzle-kit migrations.
    ignores: [
      'dist/*',
      '.expo/*',
      'node_modules/*',
      'src/**/*.generated.ts',
      'src/database/migrations/*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
