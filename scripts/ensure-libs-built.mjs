// Guards `pnpm td` against the class of bug where SteamUtility.exe silently drifts out of sync
// with libs/SteamUtility/**/*.cs on a given machine (e.g. C# changes pulled from git but never
// rebuilt locally) - see the ownership-count discrepancy this was added to fix. Runs as `pretd`
// (pnpm auto-runs this before `td`), so it's a no-op most launches and only pays the full
// `dotnet publish` cost when source actually changed.
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE_DIR = join(import.meta.dirname, '..', 'libs', 'SteamUtility')
const BUILT_EXE = join(import.meta.dirname, '..', 'src-tauri', 'libs', 'SteamUtility.exe')
const SKIP_DIRS = new Set(['bin', 'obj'])

function newestSourceMtime(dir) {
  let newest = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      newest = Math.max(newest, newestSourceMtime(join(dir, entry.name)))
    } else if (entry.name.endsWith('.cs') || entry.name.endsWith('.csproj')) {
      newest = Math.max(newest, statSync(join(dir, entry.name)).mtimeMs)
    }
  }
  return newest
}

const sourceMtime = newestSourceMtime(SOURCE_DIR)
const exeMtime = existsSync(BUILT_EXE) ? statSync(BUILT_EXE).mtimeMs : 0

if (sourceMtime > exeMtime) {
  console.warn('[ensure-libs-built] SteamUtility source is newer than the built exe, rebuilding...')
  execSync('pnpm build:libs', { stdio: 'inherit' })
} else {
  console.warn('[ensure-libs-built] SteamUtility.exe is up to date, skipping rebuild.')
}
