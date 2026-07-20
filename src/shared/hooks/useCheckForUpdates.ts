import { check } from '@tauri-apps/plugin-updater'
import { useEffect, useRef } from 'react'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'
import { canAutoUpdateCheck, fetchLatest, performUpdate } from '@/shared/utils/update'

const CHECK_INTERVAL_MS = 5 * 60 * 1000

/**
 * Periodically checks for updates and installs them per `latest.json`'s `major` flag:
 * - `major: true` installs silently on whichever check first sees it, no user interaction.
 * - Otherwise, the very first check since app start still installs silently (matches `main`'s
 *   behavior - existing users shouldn't linger on a stale version just because the update
 *   happened to be minor/patch); every check after that only flips `updateAvailable`, leaving the
 *   actual install to an opt-in action (e.g. `UpdateButton`).
 * Builds that can't self-update (a portable Windows zip, or a Linux deb/rpm install - see
 * platform::can_auto_update's doc comment) skip checking entirely.
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
        if (!(await canAutoUpdateCheck())) return

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
