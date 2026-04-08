import type { UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useEffect } from 'react'
import { useLoaderStore, useStateStore, useUserStore } from '@/shared/stores'
import {
  hasTauriInvoke,
  isMissingTauriInvokeError,
  isTauriRuntime,
  waitForTauriInvoke,
} from '@/shared/utils'

export function useInit() {
  const setLoadingUserSummary = useStateStore(state => state.setLoadingUserSummary)
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const { hideLoader } = useLoaderStore()

  useEffect(() => {
    let cancelled = false

    const bootstrapBackend = async () => {
      if (cancelled) return

      const tauriReady = await waitForTauriInvoke(4000, 100)
      if (!tauriReady && !hasTauriInvoke()) {
        setTimeout(() => {
          void bootstrapBackend()
        }, 250)
        return
      }

      try {
        // Emit ready event to backend so hidden main window can be shown
        await emit('ready')
        // Start the Steam status monitor once globally
        await invoke('start_steam_status_monitor')
        // Start the processes monitor once globally
        await invoke('start_processes_monitor')
      } catch (error) {
        if (isMissingTauriInvokeError(error) && !cancelled) {
          setTimeout(() => {
            void bootstrapBackend()
          }, 250)
          return
        }

        console.error('Error in (bootstrapBackend):', error)
      }
    }

    void bootstrapBackend()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    if (userSummary?.steamId) {
      setUserSummary(userSummary)
    }

    let cancelled = false

    const resolveLoaderState = async () => {
      const tauriReady = await waitForTauriInvoke(2000, 100)
      if (cancelled) return

      if (!tauriReady) {
        setLoadingUserSummary(false)
        hideLoader()
        return
      }

      setTimeout(() => {
        hideLoader()
        setTimeout(() => {
          setLoadingUserSummary(false)
        }, 250)
      }, 1500)
    }

    void resolveLoaderState()

    return () => {
      cancelled = true
    }
  }, [setUserSummary, setLoadingUserSummary, hideLoader])

  useEffect(() => {
    const closeWebview = async () => {
      try {
        const tauriReady = await waitForTauriInvoke(2000, 100)
        if (!tauriReady) return

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
