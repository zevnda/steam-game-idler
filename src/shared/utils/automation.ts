import type { InvokeDropsRemaining, InvokeGamesWithDrops } from '@/shared/types'
import type { TimeInputValue } from '@heroui/react'
import { Time } from '@internationalized/date'
import { invoke } from '@tauri-apps/api/core'
import { decrypt, logEvent, showMissingCredentialsToast } from '@/shared/utils'

// Check remaining card drops for a game
export async function checkDrops(
  steamId: string | undefined,
  appId: number,
  sid: string | undefined,
  sls: string | undefined,
  sma: string | undefined,
) {
  try {
    if (!sid || !sls) {
      showMissingCredentialsToast()
      return 0
    }

    const res = await invoke<InvokeDropsRemaining>('get_drops_remaining', {
      sid: decrypt(sid),
      sls: decrypt(sls),
      sma,
      steamId,
      appId,
    })

    if (res && res.remaining) {
      return res.remaining
    } else {
      return 0
    }
  } catch (error) {
    console.error('Error in checkDrops util: ', error)
    logEvent(`[Error] in (checkDrops) util: ${error}`)
    return 0
  }
}

// Get all games with remaining card drops
export async function getAllGamesWithDrops(
  steamId: string | undefined,
  sid: string | undefined,
  sls: string | undefined,
  sma: string | undefined,
) {
  try {
    if (!sid || !sls) {
      showMissingCredentialsToast()
      return []
    }

    const res = await invoke<InvokeGamesWithDrops>('get_games_with_drops', {
      sid: decrypt(sid),
      sls: decrypt(sls),
      sma,
      steamid: steamId,
    })

    if (res.gamesWithDrops && res.gamesWithDrops.length > 0) {
      return res.gamesWithDrops
    } else {
      return []
    }
  } catch (error) {
    console.error('Error in getAllGamesWithDrops util: ', error)
    logEvent(`[Error] in (getAllGamesWithDrops) util: ${error}`)
    return []
  }
}

// Check if the current time is within the specified schedule
export function isWithinSchedule(scheduleFrom: TimeInputValue, scheduleTo: TimeInputValue) {
  const now = new Date()
  const currentTime = new Time(now.getHours(), now.getMinutes())
  const scheduleFromTime = new Time(scheduleFrom.hour, scheduleFrom.minute)
  const scheduleToTime = new Time(scheduleTo.hour, scheduleTo.minute)
  if (scheduleToTime.compare(scheduleFromTime) < 0) {
    return currentTime.compare(scheduleFromTime) >= 0 || currentTime.compare(scheduleToTime) < 0
  } else {
    return currentTime.compare(scheduleFromTime) >= 0 && currentTime.compare(scheduleToTime) < 0
  }
}
