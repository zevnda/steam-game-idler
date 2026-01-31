import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { useSettings } from '../../../stores'

export async function windowMinimize() {
  try {
    await getCurrentWindow().minimize()
  } catch (error) {
    console.error('Failed to minimize window:', error)
  }
}

export async function windowToggleMaximize() {
  try {
    await getCurrentWindow().toggleMaximize()
  } catch (error) {
    console.error('Failed to toggle maximize window:', error)
  }
}

export async function windowClose() {
  try {
    // If the user has not enabled "close to tray", quit the app
    const { globalSettings } = useSettings.getState()
    if (!globalSettings.closeToTray) {
      await invoke('quit_app')
      return
    }

    // Otherwise, hide the window and show a notification (only once)
    await getCurrentWindow().hide()

    const minToTrayNotified = localStorage.getItem('minToTrayNotified') ?? 'false'
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
  } catch (error) {
    console.error('Failed to close window:', error)
  }
}
