import type { InvokeDropsRemaining, InvokeGamesWithDrops } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { decrypt } from './crypto'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'

export async function checkDrops(
  steamId: string | undefined,
  appId: number,
  sid: string | undefined,
  sls: string | undefined,
  sma: string | undefined,
) {
  try {
    if (!sid || !sls) {
      toast.missingCredentials()
      return 0
    }
    const res = await invoke<InvokeDropsRemaining>('get_drops_remaining', {
      sid: decrypt(sid),
      sls: decrypt(sls),
      sma,
      steamId,
      appId,
    })
    return res?.remaining ?? 0
  } catch (error) {
    console.error('Error in checkDrops:', error)
    await logEvent(`[Error] in (checkDrops) util: ${error}`)
    return 0
  }
}

export async function getAllGamesWithDrops(
  steamId: string | undefined,
  sid: string | undefined,
  sls: string | undefined,
  sma: string | undefined,
) {
  try {
    if (!sid || !sls) {
      toast.missingCredentials()
      return []
    }
    const res = await invoke<InvokeGamesWithDrops>('get_games_with_drops', {
      sid: decrypt(sid),
      sls: decrypt(sls),
      sma,
      steamid: steamId,
    })
    return res?.gamesWithDrops ?? []
  } catch (error) {
    console.error('Error in getAllGamesWithDrops:', error)
    await logEvent(`[Error] in (getAllGamesWithDrops) util: ${error}`)
    return []
  }
}
