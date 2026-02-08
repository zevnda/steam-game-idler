/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,jsx,ts,tsx}': [
    'prettier --write --ignore-unknown',
    'eslint --max-warnings=0 --no-warn-ignored',
  ],
  '**/*': ['prettier --write --ignore-unknown'],
}
