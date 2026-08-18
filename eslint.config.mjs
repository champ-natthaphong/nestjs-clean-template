// @ts-check
// const tseslint = require('@typescript-eslint/eslint-plugin');
// const tsparser = require('@typescript-eslint/parser');

// import eslint from '@eslint/js';

import tseslint from 'typescript-eslint';
import tslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
// @ts-expect-error: package is installed but lacks bundled type declarations
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      'eslint.config.js',
      'commitlint.config.js',
    ],
  },
  {
    files: ['{src,test}/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tslint,
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',

      // Prevent forgotten console.log
      'no-console': 'warn',

      // Dead code elimination
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Gradually migrate away from `any`
      '@typescript-eslint/no-explicit-any': 'error',

      // Explicit return types (off — TypeScript infer ได้เอง)
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Explicit module boundary types (off)
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
          prefix: ['E'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
          prefix: ['T'],
        },
        { selector: 'class', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE', 'PascalCase'] },
      ],

      // Prevent duplicate imports
      'no-duplicate-imports': 'error',

      // Import order: NestJS core → @new_project_name/* → third-party → local (relative)
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@nestjs'], // 1. NestJS core
            ['^@new_project_name'], // 2. Shared library
            ['^@?\\w'], // 3. Third-party
            ['^\\.'], // 4. Local (relative)
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Limit function size
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],

      // Limit cyclomatic complexity
      complexity: ['warn', 15],

      // Prevent floating promises
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },
);
