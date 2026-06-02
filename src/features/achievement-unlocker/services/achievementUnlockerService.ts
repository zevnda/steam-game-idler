import type {
  Achievement,
  AchievementUnlockerSettings,
  Game,
  InvokeAchievementData,
  InvokeCustomList,
  InvokeSettings,
  UserSummary,
} from '@/shared/types'
import type { TimeInputValue } from '@heroui/react'
import { invoke } from '@tauri-apps/api/core'
import { unlockAchievement } from '@/features/achievement-manager/services/achievementsService'
import { startIdle, stopIdle } from '@/features/idle'
import { logEvent } from '@/shared/services/logService'
import { isWithinSchedule } from '@/shared/utils/schedule'

type SetGame = React.Dispatch<React.SetStateAction<Game | null>>
type SetNumber = React.Dispatch<React.SetStateAction<number>>
type SetString = React.Dispatch<React.SetStateAction<string>>
type SetBool = React.Dispatch<React.SetStateAction<boolean>>

export function getRandomDelay(min: number, max: number) {
  return Math.floor(Math.random() * ((max - min) * 60 * 1000 + 1)) + min * 60 * 1000
}

export function formatTime(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('aborted'))
      return
    }
    const checkMs = 1000
    let elapsed = 0
    const id = setInterval(() => {
      if (signal.aborted) {
        clearInterval(id)
        reject(new Error('aborted'))
        return
      }
      elapsed += checkMs
      if (elapsed >= ms) {
        clearInterval(id)
        resolve()
      }
    }, checkMs)
    signal.addEventListener('abort', () => {
      clearInterval(id)
      reject(new Error('aborted'))
    })
  })
}

function startCountdown(durationMs: number, setTimer: SetString) {
  let remaining = durationMs
  const id = setInterval(() => {
    if (remaining <= 0) {
      clearInterval(id)
      return
    }
    setTimer(formatTime(remaining))
    remaining -= 1000
  }, 1000)
}

async function waitUntilInSchedule(
  from: TimeInputValue,
  to: TimeInputValue,
  signal: AbortSignal,
  setWaiting: SetBool,
) {
  setWaiting(true)
  while (!isWithinSchedule(from, to)) {
    if (signal.aborted) {
      setWaiting(false)
      return
    }
    await sleep(60000, signal)
  }
  setWaiting(false)
}

async function getUserContext() {
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
  const res = await invoke<InvokeSettings>('get_user_settings', { steamId: userSummary?.steamId })
  return { userSummary, settings: res.settings }
}

async function removeFromUnlockerList(gameId: number) {
  try {
    const { userSummary } = await getUserContext()
    const list = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'achievementUnlockerList',
    })
    await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: 'achievementUnlockerList',
      newList: list.list_data.filter(g => g.appid !== gameId),
    })
  } catch (error) {
    await logEvent(`[Error] in removeFromUnlockerList: ${error}`)
  }
}

async function getMaxAchievementUnlocks(steamId: string | undefined, appId: number) {
  const { settings } = await getUserContext()
  const gs = (settings.gameSettings ?? {})[appId]
  if (typeof gs === 'object' && gs !== null && !Array.isArray(gs))
    return gs.maxAchievementUnlocks || null
  return null
}

async function fetchAchievementsForGame(game: Game, setAchievementCount: SetNumber) {
  const { userSummary, settings } = await getUserContext()
  const maxUnlocks = await getMaxAchievementUnlocks(userSummary?.steamId, game.appid)
  const { hidden } = settings.achievementUnlocker

  const res = await invoke<InvokeAchievementData | string>('get_achievement_data', {
    steamId: userSummary?.steamId,
    appId: game.appid,
    refetch: true,
  })
  if (typeof res === 'string' && res.includes('Failed to initialize Steam API'))
    return { achievements: [], delayBeforeFirstUnlock: undefined }

  const data = res as InvokeAchievementData
  const raw = data?.achievement_data?.achievements
  if (!raw) return { achievements: [], delayBeforeFirstUnlock: undefined }
  if (raw.some(a => a.protected_achievement)) {
    await logEvent(`[Achievement Unlocker] ${game.name} (${game.appid}) has protected achievements`)
    return { achievements: [], delayBeforeFirstUnlock: undefined }
  }

  let ordered: Array<Achievement & { skip?: boolean; delayNextUnlock?: number }> = []
  let delayBeforeFirstUnlock: number | undefined

  try {
    const customOrder = await invoke<{
      achievement_order: { achievements: Achievement[]; delayBeforeFirstUnlock?: number } | null
    }>('get_achievement_order', { steamId: userSummary?.steamId, appId: game.appid })
    if (customOrder.achievement_order?.achievements) {
      delayBeforeFirstUnlock = customOrder.achievement_order.delayBeforeFirstUnlock
      const orderMap = new Map(
        customOrder.achievement_order.achievements.map((a, i) => [a.name, i]),
      )
      ordered = raw
        .filter(a => !a.achieved && (!hidden || !a.hidden))
        .map(a => {
          const ca = customOrder.achievement_order!.achievements.find(x => x.name === a.name)
          return { ...a, skip: ca?.skip, delayNextUnlock: ca?.delayNextUnlock }
        })
        .filter(a => !a.skip)
        .sort((a, b) => {
          const oa = orderMap.get(a.name ?? '')
          const ob = orderMap.get(b.name ?? '')
          if (oa !== undefined && ob !== undefined) return oa - ob
          if (oa !== undefined) return -1
          if (ob !== undefined) return 1
          return b.percent - a.percent
        })
    } else {
      ordered = raw
        .filter(a => !a.achieved && (!hidden || !a.hidden))
        .sort((a, b) => b.percent - a.percent)
    }
  } catch {
    ordered = raw
      .filter(a => !a.achieved && (!hidden || !a.hidden))
      .sort((a, b) => b.percent - a.percent)
  }

  setAchievementCount(maxUnlocks || ordered.length)
  return { achievements: ordered, delayBeforeFirstUnlock }
}

export async function runAchievementUnlocker(
  signal: AbortSignal,
  setCurrentGame: SetGame,
  setIsComplete: SetBool,
  setAchievementCount: SetNumber,
  setCountdownTimer: SetString,
  setIsWaitingForSchedule: SetBool,
  setIsInitialDelay: SetBool,
  onStartCardFarming: () => Promise<void>,
  onStartAutoIdle: () => Promise<void>,
  hasInitialDelayed: boolean,
) {
  if (signal.aborted) return

  const { userSummary, settings } = await getUserContext()

  const list = await invoke<InvokeCustomList>('get_custom_lists', {
    steamId: userSummary?.steamId,
    list: 'achievementUnlockerList',
  })

  if (!hasInitialDelayed && list.list_data.length > 0) setCurrentGame(list.list_data[0])

  if (!hasInitialDelayed) {
    startCountdown(10000, setCountdownTimer)
    await sleep(10000, signal)
    setIsInitialDelay(false)
  }

  if (list.list_data.length === 0) {
    const { nextTaskCheckbox, nextTask } = settings.achievementUnlocker
    if (nextTaskCheckbox && nextTask) {
      if (nextTask === 'cardFarming') await onStartCardFarming()
      if (nextTask === 'autoIdle') await onStartAutoIdle()
      await logEvent('[Achievement Unlocker] No games left - moving to next task: ' + nextTask)
    } else {
      await logEvent('[Achievement Unlocker] No games left - stopping')
    }
    return setIsComplete(true)
  }

  const game = list.list_data[0]
  setCurrentGame(game)

  const { achievements, delayBeforeFirstUnlock } = await fetchAchievementsForGame(
    game,
    setAchievementCount,
  )

  if (achievements.length === 0) {
    await removeFromUnlockerList(game.appid)
    await logEvent(`[Achievement Unlocker] ${game.name} has no achievements remaining - removed`)
  } else {
    await unlockAchievementsForGame(
      achievements,
      game,
      delayBeforeFirstUnlock,
      settings.achievementUnlocker,
      userSummary,
      setAchievementCount,
      setCountdownTimer,
      setIsWaitingForSchedule,
      signal,
    )
  }

  if (!signal.aborted) {
    const remaining = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'achievementUnlockerList',
    })
    if (remaining.list_data.length > 0 && achievements.length > 0) {
      let nextHasPreDelay = false
      try {
        const next = remaining.list_data[0]
        const co = await invoke<{ achievement_order: { delayBeforeFirstUnlock?: number } | null }>(
          'get_achievement_order',
          { steamId: userSummary?.steamId, appId: next.appid },
        )
        const nd = co.achievement_order?.delayBeforeFirstUnlock
        nextHasPreDelay = typeof nd === 'number' && nd > 0
      } catch {
        /* ignore */
      }

      if (!nextHasPreDelay) {
        await logEvent('[Achievement Unlocker] Switching to next game in 2 minutes')
        startCountdown(120000, setCountdownTimer)
        await sleep(120000, signal)
      }
    }
    if (!signal.aborted)
      runAchievementUnlocker(
        signal,
        setCurrentGame,
        setIsComplete,
        setAchievementCount,
        setCountdownTimer,
        setIsWaitingForSchedule,
        setIsInitialDelay,
        onStartCardFarming,
        onStartAutoIdle,
        true,
      )
  }
}

async function unlockAchievementsForGame(
  achievements: Array<Achievement & { delayNextUnlock?: number }>,
  game: Game,
  delayBeforeFirstUnlock: number | undefined,
  settings: AchievementUnlockerSettings,
  userSummary: UserSummary,
  setAchievementCount: SetNumber,
  setCountdownTimer: SetString,
  setIsWaitingForSchedule: SetBool,
  signal: AbortSignal,
) {
  const { interval, idle, schedule, scheduleFrom, scheduleTo } = settings
  let isGameIdling = false
  const maxUnlocks = await getMaxAchievementUnlocks(userSummary?.steamId, game.appid)
  let achievementsRemaining = achievements.length

  if (typeof delayBeforeFirstUnlock === 'number' && delayBeforeFirstUnlock > 0 && !signal.aborted) {
    const ms = delayBeforeFirstUnlock * 60 * 1000
    startCountdown(ms, setCountdownTimer)
    await sleep(ms, signal)
  }

  for (const achievement of achievements) {
    if (signal.aborted) break

    if (schedule && !isWithinSchedule(scheduleFrom, scheduleTo)) {
      if (isGameIdling) {
        await stopIdle(game.appid, game.name)
        isGameIdling = false
      }
      await waitUntilInSchedule(scheduleFrom, scheduleTo, signal, setIsWaitingForSchedule)
    } else if (!isGameIdling && idle) {
      await startIdle(game.appid, game.name, false)
      isGameIdling = true
    }

    if (signal.aborted) break

    await unlockAchievement(userSummary?.steamId, game.appid, achievement.id, game.name)
    achievementsRemaining--
    await logEvent(`[Achievement Unlocker] Unlocked ${achievement.name} for ${game.name}`)
    setAchievementCount(prev => Math.max(prev - 1, 0))

    if (
      achievementsRemaining === 0 ||
      (maxUnlocks && achievements.length - achievementsRemaining >= maxUnlocks)
    ) {
      await stopIdle(game.appid, game.name)
      await removeFromUnlockerList(game.appid)
      await logEvent(`[Achievement Unlocker] Done for ${game.name} - removed`)
      break
    }

    let delayMs: number
    if (typeof achievement.delayNextUnlock === 'number' && achievement.delayNextUnlock > 0) {
      delayMs = achievement.delayNextUnlock * 60 * 1000
    } else {
      delayMs = getRandomDelay(interval[0], interval[1])
    }
    startCountdown(delayMs, setCountdownTimer)
    await sleep(delayMs, signal)
  }
}
