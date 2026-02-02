import { logEvent } from '@/shared/utils/logEvent'
import { invoke } from '@tauri-apps/api/core'

export async function checkSteamStatus() {
  try {
    const isSteamRunning = await invoke<boolean>('is_steam_running')
    return isSteamRunning
  } catch (error) {
    console.error('[Error] in (checkSteamStatus):', error)
    logEvent(`[Error] in (checkSteamStatus): ${error}`)
    return false
  }
}
