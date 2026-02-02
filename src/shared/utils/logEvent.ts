import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'

// Log all types of events to a local log file
export async function logEvent(message: string): Promise<void> {
  try {
    const version = await getVersion()
    await invoke('log_event', { message: `[v${version}] ${message}` })
  } catch (error) {
    console.error('Error in logEvent util: ', error)
  }
}
