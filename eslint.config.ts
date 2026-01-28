import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import { configs, plugins, rules } from 'eslint-config-airbnb-extended'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const projectRoot = path.resolve(dirname)
export const gitignorePath = path.resolve(projectRoot, '.gitignore')

export default defineConfig([
  globalIgnores(['docs/**']),
  includeIgnoreFile(gitignorePath),
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,

  plugins.react,
  plugins.reactHooks,
  plugins.reactA11y,
  plugins.next,
  ...configs.next.recommended,

  plugins.typescriptEslint,
  ...configs.base.typescript,
  ...configs.react.typescript,
  ...configs.next.typescript,
  rules.typescript.typescriptEslintStrict,

  reactRefreshPlugin.configs.next,

  eslintPluginPrettierRecommended,

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2024,
        ...globals.node,
        ...globals.jest,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['./tsconfig.json'],
        }),
      ],
    },
    rules: {
      'class-methods-use-this': 'off',
      'no-restricted-syntax': 'off',
      'no-promise-executor-return': 'off',
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: ['state', 'acc'],
        },
      ],
      'spaced-comment': [
        'error',
        'always',
        {
          markers: ['/'],
        },
      ],

      'import-x/extensions': 'off',
      'import-x/no-unresolved': 'error',
      'import-x/no-named-as-default': 'off',
      'import-x/prefer-default-export': 'off',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
        },
      ],

      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-filename-extension': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/require-default-props': [
        // 'error',
        'off',
        {
          classes: 'ignore',
          functions: 'ignore',
          ignoreFunctionalComponents: true,
        },
      ],
    },
  },
  {
    files: plugins.typescriptEslint.files,
    rules: {
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/no-misused-spread': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/method-signature-style': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
        },
      ],
    },
  },
])
