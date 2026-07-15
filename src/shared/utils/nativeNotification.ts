import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'

// Ported from `main`'s `sendNativeNotification` (src/shared/utils/tasks.ts) - the plugin is already
// a dependency (`@tauri-apps/plugin-notification`, `tauri_plugin_notification::init()` in lib.rs,
// `notification:default` capability), so this is a thin JS-side wrapper, no new Rust command
// needed. Requests permission lazily on first use rather than at app startup, matching `main`'s own
// behavior - only free-games' watcher calls this today.
export async function sendNativeNotification(title: string, body: string) {
  try {
    let permissionGranted = await isPermissionGranted()

    if (!permissionGranted) {
      const permission = await requestPermission()
      permissionGranted = permission === 'granted'
    }

    if (permissionGranted) {
      sendNotification({ title, body })
    }
  } catch (error) {
    console.error('Error in (sendNativeNotification):', error)
  }
}
