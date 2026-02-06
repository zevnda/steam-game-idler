import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateStore } from '@/shared/stores'
import { showDangerToast } from '@/shared/ui'
import { fetchLatest, isPortableCheck, logEvent, preserveKeysAndClearData } from '@/shared/utils'

export function useCheckForUpdates() {
  const { t } = useTranslation()
  const setUpdateAvailable = useUpdateStore(state => state.setUpdateAvailable)
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)

  useEffect(() => {
    // Check for updates - immediate update for major, or show notification
    const checkForUpdates = async () => {
      try {
        const isPortable = await isPortableCheck()
        if (isPortable) return

        const update = await check()
        if (update) {
          const latest = await fetchLatest()
          if (latest?.major) {
            localStorage.setItem('hasUpdated', 'true')
            await invoke('kill_all_steamutil_processes')
            await update.downloadAndInstall()
            await preserveKeysAndClearData()
            await relaunch()
          } else {
            setUpdateAvailable(true)
          }
        }
      } catch (error) {
        showDangerToast(t('toast.checkUpdate.error'))
        console.error('Error in (checkForUpdates):', error)
        logEvent(`Error in (checkForUpdates): ${error}`)
      }
    }
    checkForUpdates()
    const intervalId = setInterval(checkForUpdates, 5 * 60 * 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [setUpdateAvailable, t])

  useEffect(() => {
    // Show changelog after updates
    const hasUpdated = localStorage.getItem('hasUpdated')
    if (hasUpdated) {
      localStorage.removeItem('hasUpdated')
      setShowChangelog(true)
    }
  }, [setShowChangelog])
}
