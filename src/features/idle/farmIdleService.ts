import type { InvokeIdle } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { checkSteamStatus } from '@/shared/utils/system'

export interface GameForFarming {
  appid: number
  name: string
}

export async function startFarmIdle(gamesSet: Set<GameForFarming>) {
  try {
    const isSteamRunning = await checkSteamStatus(true)
    if (!isSteamRunning) return false

    const gamesList = Array.from(gamesSet).map(g => ({ app_id: Number(g.appid), name: g.name }))
    const res = await invoke<InvokeIdle>('start_farm_idle', { gamesList })
    if (res.success) {
      await logEvent(`[Card Farming] Started idling ${gamesSet.size} games`)
      return true
    } else {
      toast.accountMismatch('danger')
      await logEvent('[Error] [Card Farming] Failed to idle - possible account mismatch')
      return false
    }
  } catch (error) {
    console.error('Error in startFarmIdle:', error)
    await logEvent(`[Error] in (startFarmIdle): ${error}`)
    return false
  }
}

export async function stopFarmIdle(gamesSet: Set<GameForFarming>) {
  try {
    await invoke('stop_farm_idle')
    await logEvent(`[Card Farming] Stopped idling ${gamesSet.size} games`)
    return true
  } catch (error) {
    console.error('Error in stopFarmIdle (can often be ignored):', error)
    return false
  }
}
