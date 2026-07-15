/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,jsx,ts,tsx}': [
    'prettier --write --ignore-unknown',
    'eslint --max-warnings=0 --no-warn-ignored',
  ],
  'src/i18n/locales/en-US.json': ['node scripts/check-i18n.mjs'],
  '**/*': ['prettier --write --ignore-unknown'],
}
