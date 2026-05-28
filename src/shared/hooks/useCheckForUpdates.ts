import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { showDangerToast } from '@/shared/components'
import { useUpdateStore } from '@/shared/stores'
import { fetchLatest, isPortableCheck, logEvent, preserveKeysAndClearData } from '@/shared/utils'

export function useCheckForUpdates() {
  const { t } = useTranslation()
  const setUpdateAvailable = useUpdateStore(state => state.setUpdateAvailable)
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)
  const setIsUpdating = useUpdateStore(state => state.setIsUpdating)
  const isInitialCheck = useRef(true)

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const isPortable = await isPortableCheck()
        if (isPortable) return

        const update = await check()
        if (update) {
          const latest = await fetchLatest()
          if (latest?.major) {
            setIsUpdating(true)
            localStorage.setItem('hasUpdated', 'true')
            await invoke('kill_all_steamutil_processes')
            await Promise.all([
              update.downloadAndInstall(),
              new Promise(resolve => setTimeout(resolve, 2500)),
            ])
            await preserveKeysAndClearData()
            await relaunch()
          } else if (isInitialCheck.current) {
            setIsUpdating(true)
            localStorage.setItem('hasUpdated', 'true')
            await invoke('kill_all_steamutil_processes')
            await Promise.all([
              update.downloadAndInstall(),
              new Promise(resolve => setTimeout(resolve, 2500)),
            ])
            await relaunch()
          } else {
            setUpdateAvailable(true)
          }
        }
      } catch (error) {
        showDangerToast(t('toast.checkUpdate.error'))
        console.error('Error in (checkForUpdates):', error)
        logEvent(`Error in (checkForUpdates): ${error}`)
      } finally {
        isInitialCheck.current = false
      }
    }
    checkForUpdates()
    const intervalId = setInterval(checkForUpdates, 5 * 60 * 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [setUpdateAvailable, setIsUpdating, t])

  useEffect(() => {
    // Show changelog after updates
    const hasUpdated = localStorage.getItem('hasUpdated')
    if (hasUpdated) {
      localStorage.removeItem('hasUpdated')
      setShowChangelog(true)
    }
  }, [setShowChangelog])
}
