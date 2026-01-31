/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
  tabWidth: 2,
  useTabs: false,
  semi: false,
  printWidth: 100,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  quoteProps: 'consistent',
  bracketSpacing: true,
  bracketSameLine: false,
  objectWrap: 'preserve',
  endOfLine: 'lf',
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0',
  importOrderCaseSensitive: false,
}
