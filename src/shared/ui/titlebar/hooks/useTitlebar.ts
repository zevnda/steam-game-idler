import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { useUserStore } from '@/shared/stores/userStore'

interface TitlebarProps {
  windowMinimize: () => Promise<void>
  windowToggleMaximize: () => Promise<void>
  windowClose: () => Promise<void>
}

export default function useTitlebar(): TitlebarProps {
  const userSettings = useUserStore(state => state.userSettings)

  const windowMinimize = async (): Promise<void> => {
    await getCurrentWindow().minimize()
  }

  const windowToggleMaximize = async (): Promise<void> => {
    await getCurrentWindow().toggleMaximize()
  }

  const windowClose = async (): Promise<void> => {
    // If the user has not enabled "close to tray", quit the app
    if (!userSettings.general.closeToTray) {
      await invoke('quit_app')
      return
    }

    await getCurrentWindow().hide()

    const minToTrayNotified = localStorage.getItem('minToTrayNotified') || 'false'
    let permissionGranted = await isPermissionGranted()
    if (minToTrayNotified !== 'true') {
      if (!permissionGranted) {
        const permission = await requestPermission()
        permissionGranted = permission === 'granted'
      }
      if (permissionGranted) {
        sendNotification({
          title: 'Steam Game Idler will continue to run in the background',
          icon: 'icons/32x32.png',
        })
      }
    }
    localStorage.setItem('minToTrayNotified', 'true')
  }

  return {
    windowMinimize,
    windowToggleMaximize,
    windowClose,
  }
}
