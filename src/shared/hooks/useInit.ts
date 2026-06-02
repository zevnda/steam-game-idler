import type { UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSessionStore, useUiStore, useUserStore } from '@/shared/stores'

export function useInit() {
  const setLoadingUserSummary = useUiStore(s => s.setLoadingUserSummary)
  const setUserSummary = useUserStore(s => s.setUserSummary)
  const { hideLoader } = useSessionStore()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    emit('ready')
    invoke('start_steam_status_monitor')
    invoke('start_processes_monitor')
  }, [])

  useEffect(() => {
    invoke('update_tray_menu', {
      show: t('tray.show'),
      update: t('tray.update'),
      quit: t('tray.quit'),
    })
  }, [t, i18n.language])

  useEffect(() => {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (userSummary?.steamId) setUserSummary(userSummary)

    setTimeout(() => {
      hideLoader()
      setTimeout(() => setLoadingUserSummary(false), 250)
    }, 1500)
  }, [setUserSummary, setLoadingUserSummary, hideLoader])

  useEffect(() => {
    const closeWebview = async () => {
      try {
        const webview = await WebviewWindow.getByLabel('webview')
        setTimeout(async () => {
          await webview?.close()
        }, 5000)
      } catch (error) {
        console.error('Error in closeWebview:', error)
      }
    }
    closeWebview()
  }, [])
}
