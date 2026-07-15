import type { Settings } from '@/features/settings/types'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@/shared/utils/invoke'

const CLOSE_TO_TRAY_NOTIFIED_KEY = 'closeToTrayNotified'

// Drives the app-wide custom titlebar's window controls. The frameless/custom-chrome window
// (tauri.conf.json's `decorations: false`) has no OS close box / `WindowEvent::CloseRequested` to
// intercept, so `close` is the only place `Settings.close_to_tray` is ever read - fresh via
// `get_settings` on every click rather than a store, since there's no ongoing side effect to keep
// in sync (mirrors GeneralSettingsTab.tsx's own reasoning for not giving this setting a store).
export const useTitlebar = () => {
  const { t } = useTranslation()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const appWindow = getCurrentWindow()
    let isMounted = true

    appWindow.isMaximized().then(maximized => {
      if (isMounted) {
        setIsMaximized(maximized)
      }
    })

    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized)
    })

    return () => {
      isMounted = false
      unlisten.then(stop => stop())
    }
  }, [])

  const minimize = () => {
    getCurrentWindow().minimize()
  }

  const toggleMaximize = () => {
    getCurrentWindow().toggleMaximize()
  }

  const close = async () => {
    let closeToTray = true
    try {
      const settings = await invoke<Settings>('get_settings')
      closeToTray = settings.closeToTray
    } catch (error) {
      console.error('Error in (get_settings) for close-to-tray check:', error)
    }

    if (!closeToTray) {
      await invoke('quit_app')
      return
    }

    await getCurrentWindow().hide()

    // Only a native OS notification can reach the user here - the window (and every in-app toast
    // surface with it) is already hidden by the time this fires. Once-per-install via localStorage,
    // matching `main`'s own `minToTrayNotified` behavior.
    if (localStorage.getItem(CLOSE_TO_TRAY_NOTIFIED_KEY) === 'true') {
      return
    }

    try {
      let granted = await isPermissionGranted()
      if (!granted) {
        granted = (await requestPermission()) === 'granted'
      }
      if (granted) {
        sendNotification({
          title: t('titlebar.closeToTrayNotification'),
          icon: 'icons/32x32.png',
        })
      }
    } catch (error) {
      console.error('Error in (sendNotification) for close-to-tray:', error)
    }
    localStorage.setItem(CLOSE_TO_TRAY_NOTIFIED_KEY, 'true')
  }

  return { isMaximized, minimize, toggleMaximize, close }
}
