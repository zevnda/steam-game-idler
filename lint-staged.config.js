/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 *
 * Fast, staged-files-only checks run by the husky pre-commit hook. The full-repo checks
 * (typecheck, clippy, whole-tree format/lint) live in .github/workflows/checks.yml instead - too
 * slow for every commit, and cargo here would also fight `pnpm tauri dev`'s watcher over the same
 * target dir.
 *
 * lint-staged runs different globs' tasks concurrently, so the globs must not overlap: two tasks
 * writing the same file at once can corrupt it.
 */
export default {
  '*.{js,jsx,ts,tsx}': [
    'prettier --write --ignore-unknown',
    'eslint --max-warnings=0 --no-warn-ignored',
  ],
  // Formatting only (no compile), so it's instant. Edition comes from src-tauri/rustfmt.toml.
  '*.rs': 'rustfmt',
  // Everything else Prettier understands (JSON, CSS, YAML, ...); `--ignore-unknown` skips the rest.
  // en-US.json is excluded so its own entry below can format it *before* checking it.
  '!(*.{js,jsx,ts,tsx,rs}|en-US.json)': 'prettier --write --ignore-unknown',
  'src/i18n/locales/en-US.json': ['prettier --write', 'node scripts/check-i18n.mjs'],
}
