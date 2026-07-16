#!/usr/bin/env node
// Crowdin's nested-JSON exporter emits every source key when `skip_untranslated_strings` is
// set, but fills untranslated ones with "" instead of omitting them entirely
//
// Wired into .github/workflows/crowdin.yml, after the Crowdin download step and before the
// translations PR is opened.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LOCALES_DIR = fileURLToPath(new URL('../src/i18n/locales', import.meta.url))
const SOURCE_LOCALE = 'en-US.json'

// Deletes only leaf keys whose value is the literal empty string "" - never touches a key holding
// real translated text, regardless of nesting depth
const stripEmptyLeaves = node => {
  let strippedCount = 0
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string') {
      if (value === '') {
        delete node[key]
        strippedCount++
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      strippedCount += stripEmptyLeaves(value)
      // An object that's now empty (every key under it was untranslated) collapses away too, so
      // untranslated sections don't leave dangling `{}` behind in the diff.
      if (Object.keys(value).length === 0) {
        delete node[key]
      }
    }
  }
  return strippedCount
}

let hadUnexpectedShape = false
let totalStripped = 0
let filesChanged = 0

for (const entry of readdirSync(LOCALES_DIR)) {
  if (!entry.endsWith('.json') || entry === SOURCE_LOCALE) continue

  const filePath = join(LOCALES_DIR, entry)
  const raw = readFileSync(filePath, 'utf8')

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error(
      `[strip-crowdin-empty-translations] ${entry}: failed to parse JSON - ${err.message}`,
    )
    hadUnexpectedShape = true
    continue
  }

  const strippedCount = stripEmptyLeaves(parsed)

  if (strippedCount === 0) {
    console.error(`[strip-crowdin-empty-translations] ${entry}: no empty placeholder strings found`)
    continue
  }

  writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')
  totalStripped += strippedCount
  filesChanged++
  console.error(
    `[strip-crowdin-empty-translations] ${entry}: stripped ${strippedCount} empty placeholder string(s)`,
  )
}

if (hadUnexpectedShape) {
  console.error(
    '[strip-crowdin-empty-translations] one or more locale files could not be parsed - failing so this does not silently ship broken translations',
  )
  process.exit(1)
}

console.error(
  `[strip-crowdin-empty-translations] done - ${totalStripped} key(s) stripped across ${filesChanged} file(s)`,
)
