import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import typescriptParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

const config = [
  {
    ignores: [
      '.next/**/*',
      'out/**/*',
      'node_modules/**/*',
      'src-tauri/**/*',
      'docs/public/**/*',
      'docs/.next/**/*',
      'docs/node_modules/**/*',
    ],
  },
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  {
    plugins: {
      'unused-imports': unusedImports,
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'strict': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          args: 'none',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      'react/no-unescaped-entities': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/self-closing-comp': 'error',
      'react/no-array-index-key': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-curly-brace-presence': [
        'warn',
        {
          props: 'never',
          children: 'never',
        },
      ],
      'react/jsx-fragments': ['error', 'syntax'],
      'no-multiple-empty-lines': 'warn',
      'no-unreachable': 'error',
      'no-sync': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'no-console': [
        'error',
        {
          allow: ['error'],
        },
      ],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'object-shorthand': ['warn', 'always'],
      '@typescript-eslint/triple-slash-reference': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]

export default config
