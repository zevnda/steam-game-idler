import type { Game, InvokeDropsRemaining, InvokeGamesWithDrops } from '@/types'

import { Time } from '@internationalized/date'

import { invoke } from '@tauri-apps/api/core'

import { logEvent } from '@/utils/tasks'

// Check remaining card drops for a game
export async function checkDrops(
  steamId: string | undefined,
  appId: number,
  sid: string | undefined,
  sls: string | undefined,
  sma: string | undefined,
): Promise<number> {
  try {
    const res = await invoke<InvokeDropsRemaining>('get_drops_remaining', {
      sid,
      sls,
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
): Promise<Game[]> {
  try {
    const res = await invoke<InvokeGamesWithDrops>('get_games_with_drops', {
      sid,
      sls,
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
export function isWithinSchedule(scheduleFrom: Time, scheduleTo: Time): boolean {
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
