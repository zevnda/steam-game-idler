import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useSessionStore } from '@/shared/stores'
import { fetchLatest, isPortableCheck, preserveKeysAndClearData } from '@/shared/utils'

export function useCheckForUpdates() {
  const { t } = useTranslation()
  const setUpdateAvailable = useSessionStore(s => s.setUpdateAvailable)
  const setShowChangelog = useSessionStore(s => s.setShowChangelog)
  const setIsUpdating = useSessionStore(s => s.setIsUpdating)
  const isInitialCheck = useRef(true)

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const isPortable = await isPortableCheck()
        if (isPortable) return

        const update = await check()
        if (update) {
          const latest = await fetchLatest()
          if (latest?.major || isInitialCheck.current) {
            setIsUpdating(true)
            localStorage.setItem('hasUpdated', 'true')
            await invoke('kill_all_steamutil_processes')
            await Promise.all([
              update.downloadAndInstall(),
              new Promise(resolve => setTimeout(resolve, 2500)),
            ])
            if (latest?.major) await preserveKeysAndClearData()
            await relaunch()
          } else {
            setUpdateAvailable(true)
          }
        }
      } catch (error) {
        toast.danger(t('toast.checkUpdate.error'))
        console.error('Error in checkForUpdates:', error)
        await logEvent(`Error in (checkForUpdates): ${error}`)
      } finally {
        isInitialCheck.current = false
      }
    }

    checkForUpdates()
    const id = setInterval(checkForUpdates, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [setUpdateAvailable, setIsUpdating, t])

  useEffect(() => {
    const hasUpdated = localStorage.getItem('hasUpdated')
    if (hasUpdated) {
      localStorage.removeItem('hasUpdated')
      setShowChangelog(true)
    }
  }, [setShowChangelog])
}
