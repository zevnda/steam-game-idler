#!/usr/bin/env node
// Flags exact-duplicate leaf string values in en-US.json (waste against Crowdin's free-tier word
// cap - see CLAUDE.md's i18n section) and leaf keys with no reference anywhere in src/ (dead
// weight carried forward from a removed/refactored feature).
//
// Run: node scripts/check-i18n.mjs
// Wired into lint-staged for src/i18n/locales/en-US.json (see lint-staged.config.js).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LOCALE_PATH = fileURLToPath(new URL('../src/i18n/locales/en-US.json', import.meta.url))
const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url))

// Key paths intentionally left duplicated after the 2026-07 dedup audit - each is a deliberate
// judgement call (see CLAUDE.md), not an oversight. Add a new entry here only with the same level
// of scrutiny: prefer reusing/promoting to a shared key over allowlisting a new duplicate.
const ALLOWLIST = new Set([
  // "Settings" - common.actions.settings is an icon-button label; dashboard.settings.title is the
  // settings panel's own page heading. Same English word today, different UI role.
  'common.actions.settings',
  'dashboard.settings.title',
  // "Close" - common.actions.close is a generic dialog/modal close action; titlebar.close is
  // specifically the OS window-chrome close button, a distinct component/context.
  'common.actions.close',
  'titlebar.close',
  // "View on Steam" - common.gameCardMenu.viewOnSteam links to a game's store page (the game-card
  // context menu); dashboard.achievements.header.viewOnSteam links to that game's Steam Community
  // achievements-stats page instead. Same English text today, different URL/role.
  'common.gameCardMenu.viewOnSteam',
  'dashboard.achievements.header.viewOnSteam',
])

const collectLeaves = (node, path, valuesOut, pathsOut) => {
  for (const [key, value] of Object.entries(node)) {
    const nextPath = path ? `${path}.${key}` : key
    if (typeof value === 'string') {
      pathsOut.push(nextPath)
      if (!valuesOut.has(value)) valuesOut.set(value, [])
      valuesOut.get(value).push(nextPath)
    } else if (value && typeof value === 'object') {
      collectLeaves(value, nextPath, valuesOut, pathsOut)
    }
  }
}

const findDuplicates = byValue => {
  const offenders = []
  for (const [value, paths] of byValue) {
    if (paths.length < 2) continue
    const unallowed = paths.filter(path => !ALLOWLIST.has(path))
    if (unallowed.length >= 2) offenders.push({ value, paths })
  }
  return offenders
}

const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const walkSourceFiles = (dir, out) => {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkSourceFiles(full, out)
    } else if (SCAN_EXTS.has(extname(entry))) {
      out.push(full)
    }
  }
}

// i18next selects a plural form (key_one/_other/_zero/_two/_few/_many) automatically from the
// base key + a `count` option passed to t() - the suffixed key itself never appears literally in
// source, so it needs its base key checked instead.
const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other']

const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Finds every leaf key with no reference anywhere in src/ - covers literal t('key.path') calls,
// TranslationKey-typed map values (errorMessageKey.ts, sortOwnedGames.ts, ...), and Trans's
// i18nKey prop, since all of these are quoted string literals matching the key exactly. A
// template-literal dynamic key (e.g. t(`dashboard.foo.${variant}`)) is handled separately by
// turning its ${...} placeholders into a wildcard and matching leaf keys against that pattern.
const findUnusedKeys = leaves => {
  const files = []
  walkSourceFiles(SRC_DIR, files)
  const haystack = files.map(f => readFileSync(f, 'utf-8')).join('\n')

  const used = new Set()
  for (const leaf of leaves) {
    if (new RegExp(`['"\`]${escapeRegExp(leaf)}['"\`]`).test(haystack)) used.add(leaf)
  }

  const templateRe = /`([a-zA-Z0-9_.${}]*\$\{[^`]*?\}[a-zA-Z0-9_.${}]*)`/g
  const templatePatterns = []
  let match
  while ((match = templateRe.exec(haystack))) {
    const tpl = match[1]
    if (!tpl.includes('.')) continue
    templatePatterns.push(new RegExp(`^${tpl.replace(/\$\{[^}]*\}/g, '[^.]+')}$`))
  }
  for (const leaf of leaves) {
    if (!used.has(leaf) && templatePatterns.some(p => p.test(leaf))) used.add(leaf)
  }

  for (const leaf of leaves) {
    if (used.has(leaf)) continue
    const suffix = PLURAL_SUFFIXES.find(s => leaf.endsWith(s))
    if (!suffix) continue
    const base = leaf.slice(0, -suffix.length)
    if (new RegExp(`['"\`]${escapeRegExp(base)}['"\`]`).test(haystack)) used.add(leaf)
  }

  return leaves.filter(leaf => !used.has(leaf))
}

const main = () => {
  const json = JSON.parse(readFileSync(LOCALE_PATH, 'utf-8'))
  const byValue = new Map()
  const leaves = []
  collectLeaves(json, '', byValue, leaves)

  const duplicates = findDuplicates(byValue)
  const unused = findUnusedKeys(leaves)

  if (duplicates.length === 0 && unused.length === 0) {
    process.exit(0)
  }

  if (duplicates.length > 0) {
    console.error(`Found ${duplicates.length} duplicate translation string(s) in en-US.json:\n`)
    for (const { value, paths } of duplicates) {
      console.error(`  "${value}"`)
      for (const path of paths) console.error(`    - ${path}`)
      console.error('')
    }
    console.error(
      'Reuse an existing key (e.g. a common.* key) instead of duplicating the string, or add ' +
        'the key path to ALLOWLIST in scripts/check-i18n.mjs with a reason if the duplication ' +
        'is genuinely intentional.\n',
    )
  }

  if (unused.length > 0) {
    console.error(`Found ${unused.length} unused translation key(s) in en-US.json:\n`)
    for (const path of unused) console.error(`  - ${path}`)
    console.error(
      '\nRemove these keys (and their parent object if it becomes empty), or add a real ' +
        "reference if this was a false positive - see findUnusedKeys's doc comment in " +
        'scripts/check-i18n.mjs for what it does and does not detect.',
    )
  }

  process.exit(1)
}

main()
