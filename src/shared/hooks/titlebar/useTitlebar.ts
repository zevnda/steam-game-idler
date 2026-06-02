import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { useUserStore } from '@/shared/stores'

export function useTitlebar() {
  const userSettings = useUserStore(s => s.userSettings)

  const windowMinimize = () => getCurrentWindow().minimize()

  const windowToggleMaximize = () => getCurrentWindow().toggleMaximize()

  const windowClose = async () => {
    if (!userSettings.general.closeToTray) {
      await invoke('quit_app')
      return
    }

    await getCurrentWindow().hide()

    const notified = localStorage.getItem('minToTrayNotified') || 'false'
    let permissionGranted = await isPermissionGranted()
    if (notified !== 'true') {
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

  return { windowMinimize, windowToggleMaximize, windowClose }
}
