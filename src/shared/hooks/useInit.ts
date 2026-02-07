import type { UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useEffect } from 'react'
import { useLoaderStore, useStateStore, useUserStore } from '@/shared/stores'

export function useInit() {
  const setLoadingUserSummary = useStateStore(state => state.setLoadingUserSummary)
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const { hideLoader } = useLoaderStore()

  console.debug('Monitor for rerenders')

  useEffect(() => {
    // Emit ready event to backend
    emit('ready')
    // Start the Steam status monitor once globally
    invoke('start_steam_status_monitor')
    // Start the processes monitor once globally
    invoke('start_processes_monitor')
  }, [])

  useEffect(() => {
    // Set user summary data
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    if (userSummary?.steamId) {
      setUserSummary(userSummary)
    }

    setTimeout(() => {
      hideLoader()
      setTimeout(() => {
        setLoadingUserSummary(false)
      }, 250)
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
        console.error('Error in (closeWebview):', error)
      }
    }
    closeWebview()
  }, [])
}
