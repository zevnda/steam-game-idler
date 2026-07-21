import { check } from '@tauri-apps/plugin-updater'
import { useEffect, useRef } from 'react'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { fetchLatest, isPortableCheck, performUpdate } from '@/shared/utils/update'

const CHECK_INTERVAL_MS = 5 * 60 * 1000

/**
 * Periodically checks for updates and installs them per `latest.json`'s `major` flag:
 * - `major: true` installs silently on whichever check first sees it, no user interaction.
 * - Otherwise, the very first check since app start still installs silently (matches `main`'s
 *   behavior - existing users shouldn't linger on a stale version just because the update
 *   happened to be minor/patch); every check after that only flips `updateAvailable`, leaving the
 *   actual install to an opt-in action (e.g. `UpdateButton`).
 * Portable builds skip checking entirely, since they have no installer to run. Dev builds
 * (`pnpm tauri dev`) also skip checking, since a downloaded production installer relaunching over
 * a dev session would be a surprising, disruptive side effect of local development.
 */
export function useCheckForUpdates() {
  const setUpdateAvailable = useUpdateStore(state => state.setUpdateAvailable)
  const setIsUpdating = useUpdateStore(state => state.setIsUpdating)
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)
  const isInitialCheck = useRef(true)

  useEffect(() => {
    // `performUpdate` sets this flag right before relaunching (and it's in `KEYS_TO_PRESERVE`, so
    // it survives a major update's data clear too) - this is the other half, read once on the
    // first mount after that relaunch to actually pop the changelog.
    if (localStorage.getItem('hasUpdated')) {
      localStorage.removeItem('hasUpdated')
      setShowChangelog(true)
    }
  }, [setShowChangelog])

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // A `pnpm tauri dev` build's version compares against the same public `latest.json` as a
        // real release, so an unlucky version match can otherwise walk straight into
        // `performUpdate` and downloadAndInstall a production installer over a dev session. Fails
        // toward checking (matches production) if `is_dev` itself errors.
        const isDev = await invoke<boolean>('is_dev').catch(() => false)
        if (isDev) return

        if (await isPortableCheck()) return

        const update = await check()
        if (!update) return

        const latest = await fetchLatest()

        if (latest?.major || isInitialCheck.current) {
          await performUpdate(update, { major: !!latest?.major, setIsUpdating })
        } else {
          setUpdateAvailable(true)
        }
      } catch (error) {
        console.error('Error in (checkForUpdates):', error)
        logFrontendWarn('useCheckForUpdates', 'update check/install failed', {
          error: String(error),
        })
        // A failure partway through performUpdate (e.g. downloadAndInstall rejecting) would
        // otherwise strand the user on UpdateLoader forever, since it only ever unmounts via a
        // successful relaunch - main had this same gap.
        setIsUpdating(false)
      } finally {
        isInitialCheck.current = false
      }
    }

    checkForUpdates()
    const intervalId = setInterval(checkForUpdates, CHECK_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [setUpdateAvailable, setIsUpdating])
}
