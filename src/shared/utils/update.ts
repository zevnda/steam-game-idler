import type { Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { logFrontendInfo, logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// The `major` flag `latest.json` carries isn't part of the Tauri updater plugin's own Update
// shape (see tauri.conf.json's `plugins.updater.endpoints`) - it's a field this project adds to
// drive silent-vs-opt-in install behavior, so it has to be fetched separately from the same file.
interface LatestManifest {
  version: string
  major: boolean
}

export async function fetchLatest() {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/zevnda/steam-game-idler/main/latest.json',
    )
    return (await res.json()) as LatestManifest
  } catch (error) {
    console.error('Error in (fetchLatest):', error)
    logFrontendWarn('update', 'update check failed', { error: String(error) })
    return null
  }
}

export async function isPortableCheck() {
  try {
    return await invoke<boolean>('is_portable')
  } catch (error) {
    console.error('Error in (isPortableCheck):', error)
    return false
  }
}

// Keys a major update's data reset should carry across relaunch, e.g. so the changelog still
// shows and the user isn't re-flagged as first-time. These are the rewrite's own current key
// names (`sgi-theme`/`closeToTrayNotified`, see `theme/applyTheme.ts`/`useTitlebar.ts`) - not
// `main`'s old ones, which this app no longer reads under those names at all.
const KEYS_TO_PRESERVE = [
  'sgi-theme',
  'closeToTrayNotified',
  'seenNotifications',
  'dismissedBanners',
  'hasUpdated',
]

// Clears local/session storage, preserving an allowlist of keys. `main`'s major-update equivalent
// also invokes `delete_all_cache_files` to wipe the on-disk cache directory - this rewrite's
// on-disk cache wipe instead runs once at Rust startup for any pre-6.0.0 upgrade regardless of
// this flow (see `legacy_migration.rs`), so this stays storage-only.
async function clearDataPreserving(keysToPreserve: string[]) {
  try {
    const preserved: Record<string, string> = {}
    for (const key of keysToPreserve) {
      const value = localStorage.getItem(key)
      if (value) preserved[key] = value
    }

    localStorage.clear()
    sessionStorage.clear()

    for (const [key, value] of Object.entries(preserved)) {
      localStorage.setItem(key, value)
    }
  } catch (error) {
    console.error('Error in (clearDataPreserving):', error)
  }
}

// Clears local/session storage before a major-version relaunch, preserving `KEYS_TO_PRESERVE`.
export async function preserveKeysAndClearData() {
  await clearDataPreserving(KEYS_TO_PRESERVE)
}

// Keys a one-off pre-6.0.0 migration should carry over, since they cause no compatibility issues
// and losing them costs the user real effort to restore - currently just `licenseKey` (a Pro
// license the user would otherwise have to look up again). Deliberately not the same allowlist as
// `KEYS_TO_PRESERVE`: this runs once on a genuinely fresh v6 environment (see
// `useLegacyMigrationCleanup.ts`), so there's nothing meaningful yet under the rewrite's own
// preference keys to carry over - the point is a clean slate, not continuity.
const LEGACY_MIGRATION_KEYS_TO_PRESERVE = ['licenseKey']

// Clears local/session storage once for a user upgrading from any pre-6.0.0 release, preserving
// `LEGACY_MIGRATION_KEYS_TO_PRESERVE`. Only called once, gated by the backend's
// `was_legacy_migration_performed` (see `useLegacyMigrationCleanup.ts`) - never on every relaunch.
export async function clearLegacyMigrationData() {
  await clearDataPreserving(LEGACY_MIGRATION_KEYS_TO_PRESERVE)
}

// The actual download/install/relaunch sequence, shared by both `useCheckForUpdates`'s silent path
// (major update, or the very first check since app start) and `UpdateButton`'s opt-in path - `main`
// duplicated this between the two, and the rewrite's own copy started the same way before
// `UpdateLoader` needed both paths to converge on one `updateStore.isUpdating` flag to actually show
// it. `setIsUpdating` is passed in rather than read from the store directly so this stays a plain,
// store-agnostic util like the rest of this file.
export async function performUpdate(
  update: Update,
  { major, setIsUpdating }: { major: boolean; setIsUpdating: (value: boolean) => void },
) {
  logFrontendInfo('update', 'installing update', { version: update.version, major })
  setIsUpdating(true)
  localStorage.setItem('hasUpdated', 'true')
  await invoke('kill_all_steam_utility_processes')
  await Promise.all([
    update.downloadAndInstall(),
    new Promise(resolve => setTimeout(resolve, 2500)),
  ])
  if (major) {
    await preserveKeysAndClearData()
  }
  await relaunch()
}
