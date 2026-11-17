import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { CDN_BASE_URL } from '@/shared/constants'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { logFrontendInfo, logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// The `major` flag `latest.json` carries isn't part of the Tauri updater plugin's own Update
// shape (see tauri.conf.json's `plugins.updater.endpoints`) - it's a field this project adds to
// drive silent-vs-opt-in install behavior, so it has to be fetched separately from the same file.
interface LatestManifest {
  version: string
  major: boolean
}

// Mirrors tauri.conf.json's `plugins.updater.endpoints` - GitHub primary, Cloudflare R2 fallback
// for regions where raw.githubusercontent.com is unreliable (confirmed via real-world testing,
// mainland China GFW DNS interference specifically targeting that host). This fetch is separate
// from the Tauri updater plugin's own endpoint-array fallback (used for `check()`/
// `downloadAndInstall()`) because `major` isn't part of the plugin's own `Update` shape, so the
// plugin's internal fallback logic can't cover it - the two URLs are duplicated here rather than
// shared with tauri.conf.json since the latter is plain JSON with no import mechanism.
const GITHUB_LATEST_JSON_URL =
  'https://raw.githubusercontent.com/zevnda/steam-game-idler/main/latest.json'
const R2_LATEST_JSON_URL = `${CDN_BASE_URL}/updater/latest.json`

export async function fetchLatest() {
  try {
    const res = await fetch(GITHUB_LATEST_JSON_URL)
    if (!res.ok) throw new Error(`GitHub latest.json responded with status ${res.status}`)
    return (await res.json()) as LatestManifest
  } catch (githubError) {
    logFrontendWarn('update', 'GitHub latest.json check failed, falling back to Cloudflare R2', {
      error: String(githubError),
    })

    try {
      const res = await fetch(R2_LATEST_JSON_URL)
      if (!res.ok) throw new Error(`R2 latest.json responded with status ${res.status}`)
      return (await res.json()) as LatestManifest
    } catch (r2Error) {
      console.error('Error in (fetchLatest):', r2Error)
      logFrontendWarn('update', 'update check failed on every configured endpoint', {
        githubError: String(githubError),
        r2Error: String(r2Error),
      })
      return null
    }
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

// Distinct from isPortableCheck() - a build can be "not portable" (uses app_data_dir) but still
// unable to self-update, e.g. a Linux deb/rpm install. Gates whether update-check UI/logic runs
// at all; see platform::can_auto_update's doc comment for why the two checks diverge on Linux.
export async function canAutoUpdateCheck() {
  try {
    return await invoke<boolean>('can_auto_update')
  } catch (error) {
    console.error('Error in (canAutoUpdateCheck):', error)
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

// Keys only a pre-6.0.0 release ever wrote, which is how we tell a real old profile apart from a v6
// one. The backend's "migrated" flag can't: it only means this cache directory had no marker, which
// is also true of a portable build run from a new folder. Every copy of the app on a machine shares
// one WebView2 profile while each portable folder has its own cache directory, so without this check
// a new portable folder wipes the signed-in accounts of every other copy. Never add a key the current
// app writes, or that wipe comes back.
const PRE_V6_ONLY_KEYS = [
  'userSummary',
  'freeGamesIds',
  'searchQueries',
  'sortStyle',
  'inventorySortStyle',
  'lockedTradingCards',
  'minToTrayNotified',
]

// Clears local/session storage once for a user upgrading from any pre-6.0.0 release, preserving
// `LEGACY_MIGRATION_KEYS_TO_PRESERVE`, and returns whether it did. Called only on a launch the
// backend flagged via `was_legacy_migration_performed` (see `useLegacyMigrationCleanup.ts`).
export async function clearLegacyMigrationData() {
  if (!PRE_V6_ONLY_KEYS.some(key => localStorage.getItem(key) !== null)) return false

  await clearDataPreserving(LEGACY_MIGRATION_KEYS_TO_PRESERVE)
  return true
}

// The updater plugin sets no timeout of its own, so without one a request on a connection that
// silently dropped (Wi-Fi blip, router reconnect, IP change) never errors and waits forever.
const UPDATE_CHECK_TIMEOUT_MS = 15_000

// How long a download may go without receiving any data before it counts as stalled. Deliberately
// not the plugin's own `download({ timeout })`: that caps the whole request, so it would have to be
// long enough for a slow connection to finish the installer, and would then take just as long to
// notice a dead one.
const DOWNLOAD_STALL_TIMEOUT_MS = 30_000

// `check()` with a timeout. Every update entry point uses this rather than calling `check()`
// directly, so none of them can hang on a dead connection.
export function checkForUpdate() {
  return check({ timeout: UPDATE_CHECK_TIMEOUT_MS })
}

// Downloads the update, rejecting once no data has arrived for DOWNLOAD_STALL_TIMEOUT_MS. The
// stalled request itself can't be cancelled from here and is simply abandoned - a retry starts a
// fresh `check()` (and so a fresh `Update` and connection) rather than reusing this one.
function downloadWithStallDetection(update: Update, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    let total: number | undefined
    let received = 0
    let lastActivity = Date.now()

    const watchdog = setInterval(() => {
      if (Date.now() - lastActivity < DOWNLOAD_STALL_TIMEOUT_MS) return
      clearInterval(watchdog)
      reject(new Error(`no data received for ${DOWNLOAD_STALL_TIMEOUT_MS / 1000}s`))
    }, 1000)

    const onEvent = (event: DownloadEvent) => {
      lastActivity = Date.now()
      if (event.event === 'Started') {
        total = event.data.contentLength
      } else if (event.event === 'Progress') {
        received += event.data.chunkLength
        if (total) onProgress(Math.min(received / total, 1))
      }
    }

    update.download(onEvent).then(
      () => {
        clearInterval(watchdog)
        resolve()
      },
      error => {
        clearInterval(watchdog)
        reject(error)
      },
    )
  })
}

// Guards against a second performUpdate starting while one is already running (e.g. the periodic
// check firing while the first install's download is still in progress).
let updateInFlight = false

// The actual download/install/relaunch sequence, shared by every update entry point
// (`useCheckForUpdates`'s silent path, `UpdateButton`, the titlebar menu, `VersionPolicyDialog`, and
// UpdateLoader's retry). Never throws: a failure leaves `UpdateLoader` up in its error state (see
// `updateStore.updateFailed`), where the user can retry or continue without updating. Returning at
// all means the attempt failed or was skipped - a successful install ends in a relaunch.
export async function performUpdate(update: Update, { major }: { major: boolean }) {
  if (updateInFlight) return
  updateInFlight = true

  const store = useUpdateStore.getState()
  logFrontendInfo('update', 'installing update', { version: update.version, major })
  store.setUpdateFailed(false)
  store.setDownloadProgress(null)
  store.setIsUpdating(true)

  try {
    // Download first, kill, then install - not kill-then-downloadAndInstall. Automation keeps
    // running during the download (session restore and auto-idle both start SteamUtility right at
    // launch, exactly when the first update check installs silently), so a kill done before the
    // download can be undone by a fresh spawn and the installer then hits a locked SteamUtility
    // file. The installer also closes SteamUtility itself (installer-hooks.nsh) as the backstop for
    // whatever still starts in the milliseconds between these two calls.
    await Promise.all([
      downloadWithStallDetection(update, store.setDownloadProgress),
      new Promise(resolve => setTimeout(resolve, 2500)),
    ])
    await invoke('kill_all_steam_utility_processes')
    // Set right before install, not at the start: on Windows `install()` hands off to the installer
    // and exits the app, so nothing after it runs - but a failed download must not leave this set,
    // or the next launch would show the changelog for a version that never installed.
    localStorage.setItem('hasUpdated', 'true')
    await update.install()
    if (major) {
      await preserveKeysAndClearData()
    }
    await relaunch()
  } catch (error) {
    localStorage.removeItem('hasUpdated')
    logFrontendWarn('update', 'update failed', { version: update.version, error: String(error) })
    store.setUpdateFailed(true)
    // So "continue without updating" still leaves the titlebar's update button to try again later
    store.setUpdateAvailable(true)
  } finally {
    updateInFlight = false
  }
}

// UpdateLoader's "Try again". Starts over with a fresh `check()` instead of reusing the failed
// `Update`, whose stalled download may still be holding a dead connection open.
export async function retryUpdate() {
  if (updateInFlight) return
  const store = useUpdateStore.getState()
  logFrontendInfo('update', 'retrying update')
  store.setUpdateFailed(false)
  store.setDownloadProgress(null)

  try {
    const update = await checkForUpdate()
    if (!update) {
      // Nothing to install anymore (e.g. the release was pulled) - just go back to the app
      logFrontendInfo('update', 'retry found no update to install')
      store.setIsUpdating(false)
      return
    }
    const latest = await fetchLatest()
    await performUpdate(update, { major: !!latest?.major })
  } catch (error) {
    logFrontendWarn('update', 'update retry check failed', { error: String(error) })
    store.setUpdateFailed(true)
  }
}

// UpdateLoader's "Continue without updating" - closes the update screen and returns to the app.
// The titlebar's update button stays available (performUpdate's failure path sets it).
export function dismissFailedUpdate() {
  logFrontendInfo('update', 'user continued without updating')
  const store = useUpdateStore.getState()
  store.setUpdateFailed(false)
  store.setDownloadProgress(null)
  store.setIsUpdating(false)
}
