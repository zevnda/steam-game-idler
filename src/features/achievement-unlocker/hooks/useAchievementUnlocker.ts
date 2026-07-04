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
import { showAccountMismatchToast } from '@/shared/components'
import {
  isWithinSchedule,
  logEvent,
  startAutoIdleGames,
  startIdle,
  stopIdle,
  unlockAchievement,
} from '@/shared/utils'

export const MAX_CONCURRENT_GAMES = 32

const INTER_GAME_DELAY_MS = 120000

const MAX_UNLOCK_ATTEMPTS = 3
const RETRY_BACKOFF_MS = [2000, 5000]

interface AchievementToUnlock {
  appId: number
  id: string
  gameName: string
  percentage: number
  name?: string
  iconLocked?: string
  hidden?: boolean
  skip?: boolean
  delayNextUnlock?: number // <-- add optional delayNextUnlock property
}

export interface UpcomingAchievement {
  id: string
  name?: string
  iconLocked?: string
  percentage: number
  unlockAt: number
}

export interface ActiveGameState {
  appId: number
  game: Game
  isInitialDelay: boolean
  achievementCount: number
  countdownTimer: string
  isWaitingForSchedule: boolean
  upcomingAchievements: UpcomingAchievement[]
}

export interface ScanProgress {
  checked: number
  total: number
}

type SetActiveGames = React.Dispatch<React.SetStateAction<ActiveGameState[]>>

export const useAchievementUnlocker = async (
  maxConcurrentGames: number,
  setActiveGames: SetActiveGames,
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>,
  setScanProgress: React.Dispatch<React.SetStateAction<ScanProgress | null>>,
  startCardFarming: () => Promise<void>,
  isMountedRef: React.RefObject<boolean>,
  abortControllerRef: React.RefObject<AbortController>,
) => {
  const hasCompletedRef = { current: false }

  const updateGame = (
    appId: number,
    patch: Partial<ActiveGameState> | ((prev: ActiveGameState) => Partial<ActiveGameState>),
  ) => {
    setActiveGames(prev =>
      prev.map(entry =>
        entry.appId === appId
          ? { ...entry, ...(typeof patch === 'function' ? patch(entry) : patch) }
          : entry,
      ),
    )
  }

  const addActiveGame = (game: Game, isInitialDelay: boolean, achievementCount = 0) => {
    setActiveGames(prev => [
      ...prev,
      {
        appId: game.appid,
        game,
        isInitialDelay,
        achievementCount,
        countdownTimer: '00:00:10',
        isWaitingForSchedule: false,
        upcomingAchievements: [],
      },
    ])
  }

  const removeActiveGame = (appId: number) => {
    setActiveGames(prev => prev.filter(entry => entry.appId !== appId))
  }

  const finalize = async () => {
    if (hasCompletedRef.current || !isMountedRef.current) return
    hasCompletedRef.current = true
    setActiveGames([])
    setScanProgress(null)

    const nextTask = await checkForNextTask()

    if (nextTask.shouldStartNextTask) {
      if (nextTask.task === 'cardFarming') {
        await startCardFarming()
        logEvent('[Achievement Unlocker] No games left - moving to next task: ' + nextTask.task)
      }

      if (nextTask.task === 'autoIdle') {
        await startAutoIdleGames()
        logEvent('[Achievement Unlocker] No games left - moving to next task: ' + nextTask.task)
      }

      return setIsComplete(true)
    }

    logEvent('[Achievement Unlocker] No games left - stopping')
    return setIsComplete(true)
  }

  const workerCount = Math.max(1, Math.min(maxConcurrentGames, MAX_CONCURRENT_GAMES))
  const isMultipleGamesMode = workerCount > 1

  // Run in repeating passes: scan the entire current backlog for achievement data first, then
  // only once that's fully resolved do we start unlocking the games found to have achievements
  // remaining. This keeps the "currently farming" UI honest - it never appears until scanning
  // has actually finished - and avoids the achievement-data fetches (one external process spawn
  // per game) competing with real unlock calls for the same time. Looping lets games added to
  // the list mid-run still get picked up on the next pass.
  while (isMountedRef.current && !hasCompletedRef.current) {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    const currentList = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'achievementUnlockerList',
    })
    const backlog = currentList.list_data

    if (backlog.length === 0) {
      await finalize()
      return
    }

    // Phase 1: scan the whole backlog for achievement data, filtering out games with nothing
    // left to unlock, before any game is shown as active
    const totalToScan = backlog.length
    let scannedCount = 0
    setScanProgress({ checked: 0, total: totalToScan })

    const scanQueue = [...backlog]
    const readyToUnlock: Awaited<ReturnType<typeof fetchAchievements>>[] = []

    const scanWorker = async () => {
      while (isMountedRef.current) {
        const game = scanQueue.shift()
        if (!game) return

        try {
          const result = await fetchAchievements(game)
          scannedCount += 1
          setScanProgress(
            scannedCount < totalToScan ? { checked: scannedCount, total: totalToScan } : null,
          )

          if (result.achievements?.length > 0) {
            readyToUnlock.push(result)
          } else {
            await removeGameFromUnlockerList(result.game.appid)
            logEvent(
              `[Achievement Unlocker] ${result.game.name} (${result.game.appid}) has no achievements remaining - removed`,
            )
          }
        } catch (error) {
          handleError('scanWorker', error)
        }
      }
    }

    await Promise.all(Array.from({ length: workerCount }, () => scanWorker()))
    setScanProgress(null)

    if (!isMountedRef.current) return

    if (readyToUnlock.length === 0) {
      // Everything in this batch had nothing to unlock - loop back and re-check the live list
      // in case more games were added while scanning
      continue
    }

    // Phase 2: now that scanning is fully done, actually start unlocking
    const unlockQueue = [...readyToUnlock]

    const unlockWorker = async () => {
      let isFirstGameForWorker = true

      while (isMountedRef.current) {
        const next = unlockQueue.shift()
        if (!next) return

        try {
          const { achievements, game: fetchedGame, delayBeforeFirstUnlock, achievementCount } = next

          if (isFirstGameForWorker) {
            // Show the background/initial delay immediately, matching the single-game behavior
            addActiveGame(fetchedGame, true, achievementCount)
            startCountdown(10000 / 60000, fetchedGame.appid, updateGame)
            await delay(10000, isMountedRef, abortControllerRef)
            if (!isMountedRef.current) return
            updateGame(fetchedGame.appid, { isInitialDelay: false })
          } else {
            const hasPreDelay = await gameHasPreDelay(userSummary?.steamId, fetchedGame.appid)
            if (!hasPreDelay && !isMultipleGamesMode) {
              logEvent('[Achievement Unlocker] Switching to next game in 2 minutes')
              await delay(INTER_GAME_DELAY_MS, isMountedRef, abortControllerRef)
            }
            if (!isMountedRef.current) return
            addActiveGame(fetchedGame, false, achievementCount)
          }
          isFirstGameForWorker = false

          await unlockAchievements(
            achievements,
            fetchedGame,
            delayBeforeFirstUnlock,
            updateGame,
            isMountedRef,
            abortControllerRef,
          )

          removeActiveGame(fetchedGame.appid)
        } catch (error) {
          handleError('unlockWorker', error)
        }
      }
    }

    await Promise.all(Array.from({ length: workerCount }, () => unlockWorker()))
  }
}

// Fetch achievements for the current game
const fetchAchievements = async (game: Game) => {
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
  const maxAchievementUnlocks = await getMaxAchievementUnlocks(userSummary?.steamId, game.appid)

  const response = await invoke<InvokeSettings>('get_user_settings', {
    steamId: userSummary?.steamId,
  })
  const hidden = response.settings.achievementUnlocker.hidden

  try {
    const achievementResponse = await invoke<InvokeAchievementData | string>(
      'get_achievement_data',
      {
        steamId: userSummary?.steamId,
        appId: game.appid,
        refetch: false,
      },
    )

    if (
      typeof achievementResponse === 'string' &&
      achievementResponse.includes('Failed to initialize Steam API')
    ) {
      showAccountMismatchToast('danger')
      handleError('fetchAchievements', 'Account mismatch between Steam and SGI')
      return { achievements: [], game }
    }

    const achievementData = achievementResponse as InvokeAchievementData
    const rawAchievements = achievementData?.achievement_data?.achievements

    if (!rawAchievements) {
      return { achievements: [], game }
    }

    // Handle games with protected achievements
    if (rawAchievements.some(achievement => achievement.protected_achievement === true)) {
      logEvent(
        `[Error] [Achievement Unlocker] ${game.name} (${game.appid}) contains protected achievements`,
      )
      return { achievements: [], game }
    }

    // First check if there's a custom order file
    let orderedAchievements: AchievementToUnlock[] = []
    let delayBeforeFirstUnlock: number | undefined

    try {
      const customOrder = await invoke<{
        achievement_order: { achievements: Achievement[]; delayBeforeFirstUnlock?: number } | null
      }>('get_achievement_order', {
        steamId: userSummary?.steamId,
        appId: game.appid,
      })

      // If we have a custom order, use that order to sort achievements
      if (customOrder.achievement_order?.achievements) {
        logEvent(`Custom achievement order found for ${game.name} (${game.appid}), applying order`)
        delayBeforeFirstUnlock = customOrder.achievement_order.delayBeforeFirstUnlock

        const customOrderMap = new Map(
          customOrder.achievement_order.achievements.map((achievement, index) => [
            achievement.name,
            index,
          ]),
        )

        // Filter and map achievements
        orderedAchievements = rawAchievements
          .filter(achievement => !achievement.achieved && (!hidden || achievement.hidden === false))
          .map(achievement => {
            // Get skip and delayNextUnlock from custom order if it exists
            const customAchievement = customOrder.achievement_order!.achievements.find(
              a => a.name === achievement.name,
            )
            return {
              appId: game.appid,
              id: achievement.id,
              gameName: game.name,
              percentage: achievement.percent || 0,
              name: achievement.name,
              iconLocked: achievement.iconLocked,
              hidden: achievement.hidden,
              skip: customAchievement?.skip,
              delayNextUnlock: customAchievement?.delayNextUnlock,
            }
          })
          // Filter out achievements with skip: true
          .filter(achievement => achievement.skip !== true)
          // Sort based on custom order if achievement is in the order, otherwise put at end and sort by percentage
          .sort((a, b) => {
            const orderA = customOrderMap.get(a.name!)
            const orderB = customOrderMap.get(b.name!)

            if (orderA !== undefined && orderB !== undefined) {
              return orderA - orderB
            } else if (orderA !== undefined) {
              return -1
            } else if (orderB !== undefined) {
              return 1
            } else {
              return b.percentage - a.percentage
            }
          })
      } else {
        // No custom order, use default percentage-based sorting
        logEvent(
          `No custom achievement order found for ${game.name} (${game.appid}), using default sorting`,
        )

        orderedAchievements = rawAchievements
          .filter(achievement => !achievement.achieved && (!hidden || achievement.hidden === false))
          .map(achievement => ({
            appId: game.appid,
            id: achievement.id,
            gameName: game.name,
            percentage: achievement.percent || 0,
            name: achievement.name,
            iconLocked: achievement.iconLocked,
            hidden: achievement.hidden,
          }))
          .sort((a, b) => b.percentage - a.percentage)
      }
    } catch (error) {
      // If there's any error getting custom order, fall back to percentage-based sorting
      logEvent(`Error getting custom achievement order: ${error}`)

      orderedAchievements = rawAchievements
        .filter(achievement => !achievement.achieved && (!hidden || achievement.hidden === false))
        .map(achievement => ({
          appId: game.appid,
          id: achievement.id,
          gameName: game.name,
          percentage: achievement.percent || 0,
          name: achievement.name,
          iconLocked: achievement.iconLocked,
          hidden: achievement.hidden,
        }))
        .sort((a, b) => b.percentage - a.percentage)
    }

    return {
      achievements: orderedAchievements,
      game,
      delayBeforeFirstUnlock,
      achievementCount: maxAchievementUnlocks || orderedAchievements.length,
    }
  } catch (error) {
    handleError('fetchAchievements', error)
    return { achievements: [], game, delayBeforeFirstUnlock: undefined }
  }
}

const unlockAchievements = async (
  achievements: AchievementToUnlock[],
  game: Game,
  delayBeforeFirstUnlock: number | undefined,
  updateGame: (
    appId: number,
    patch: Partial<ActiveGameState> | ((prev: ActiveGameState) => Partial<ActiveGameState>),
  ) => void,
  isMountedRef: React.RefObject<boolean>,
  abortControllerRef: React.RefObject<AbortController>,
) => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })

    const settings: AchievementUnlockerSettings = response.settings.achievementUnlocker
    const { hidden, interval, idle, schedule, scheduleFrom, scheduleTo } = settings
    let isGameIdling = false

    let achievementsRemaining = achievements.length
    const maxAchievementUnlocks = await getMaxAchievementUnlocks(userSummary?.steamId, game.appid)

    // Precompute the delay that follows each achievement so the upcoming queue and the
    // actual wait use identical values, and so future unlock times can be projected ahead of time
    const delayMap = new Map<string, number>()
    for (const achievement of achievements) {
      if (typeof achievement.delayNextUnlock === 'number' && achievement.delayNextUnlock >= 0) {
        delayMap.set(achievement.id, achievement.delayNextUnlock * 60 * 1000)
      } else {
        delayMap.set(achievement.id, getRandomDelay(interval[0], interval[1]))
      }
    }

    // Apply delay before first unlock if configured for this game
    if (
      typeof delayBeforeFirstUnlock === 'number' &&
      delayBeforeFirstUnlock > 0 &&
      isMountedRef.current
    ) {
      const firstDelayMs = delayBeforeFirstUnlock * 60 * 1000
      logEvent(
        `[Achievement Unlocker] Waiting ${delayBeforeFirstUnlock} minute(s) before first unlock for ${game.name} (${game.appid})`,
      )
      updateGame(game.appid, {
        upcomingAchievements: buildUpcomingQueue(achievements, 0, firstDelayMs, delayMap, hidden),
      })
      await delay(firstDelayMs, isMountedRef, abortControllerRef)
    } else {
      updateGame(game.appid, {
        upcomingAchievements: buildUpcomingQueue(achievements, 0, 0, delayMap, hidden),
      })
    }

    for (const [achievementIndex, achievement] of achievements.entries()) {
      if (isMountedRef.current) {
        // Wait until within schedule if necessary
        if (schedule && !isWithinSchedule(scheduleFrom, scheduleTo)) {
          if (game && isGameIdling) {
            await stopIdle(game.appid, game.name)
            isGameIdling = false
          }
          await waitUntilInSchedule(
            scheduleFrom,
            scheduleTo,
            isMountedRef,
            game.appid,
            updateGame,
            abortControllerRef,
          )
        } else if (!isGameIdling && idle) {
          await startIdle(game.appid, game.name, false)
          isGameIdling = true
        }

        if (!isMountedRef.current) break

        // Skip hidden achievements if necessary
        if (hidden && achievement.hidden) {
          achievementsRemaining--
          updateGame(game.appid, prev => ({
            achievementCount: Math.max(prev.achievementCount - 1, 0),
          }))
          continue
        }

        // Unlock the achievement
        let unlockSucceeded = false
        for (let attempt = 0; attempt < MAX_UNLOCK_ATTEMPTS && isMountedRef.current; attempt++) {
          unlockSucceeded = await unlockAchievement(
            userSummary?.steamId,
            game.appid,
            achievement.id,
            game.name,
          )
          if (unlockSucceeded) break
          if (attempt < MAX_UNLOCK_ATTEMPTS - 1) {
            await delay(RETRY_BACKOFF_MS[attempt], isMountedRef, abortControllerRef)
          }
        }

        if (!isMountedRef.current) break

        if (!unlockSucceeded) {
          logEvent(
            `[Achievement Unlocker] Giving up on ${achievement.name} for ${game.name} after ${MAX_UNLOCK_ATTEMPTS} attempts this pass - will retry on the next scan pass`,
          )
        } else {
          achievementsRemaining--
          logEvent(`[Achievement Unlocker] Unlocked ${achievement.name} for ${game.name}`)
          updateGame(game.appid, prev => ({
            achievementCount: Math.max(prev.achievementCount - 1, 0),
          }))

          // Stop idling and remove game from list if max achievement unlocks is reached
          if (
            achievementsRemaining === 0 ||
            (maxAchievementUnlocks &&
              achievementsRemaining <= achievements.length - maxAchievementUnlocks)
          ) {
            await stopIdle(game.appid, game.name)
            await removeGameFromUnlockerList(game.appid)
            logEvent(
              `[Achievement Unlocker] Unlocked ${maxAchievementUnlocks !== null ? achievements.length - maxAchievementUnlocks : achievements.length}/${achievements.length} achievements for ${game.name} - removed`,
            )
            updateGame(game.appid, { upcomingAchievements: [] })
            break
          }
        }

        // Wait for a delay before unlocking the next achievement
        // Use the precomputed delay so the displayed upcoming queue matches the actual wait
        const delayMs = delayMap.get(achievement.id) ?? getRandomDelay(interval[0], interval[1])
        updateGame(game.appid, {
          upcomingAchievements: buildUpcomingQueue(
            achievements,
            achievementIndex + 1,
            delayMs,
            delayMap,
            hidden,
          ),
        })
        await delay(delayMs, isMountedRef, abortControllerRef)
      }
    }
  } catch (error) {
    handleError('unlockAchievements', error)
  }
}

const getMaxAchievementUnlocks = async (steamId: string | undefined, appId: number) => {
  try {
    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId,
    })
    const gameSettings = response.settings.gameSettings || {}
    const perGameSetting = gameSettings[appId]
    if (
      typeof perGameSetting === 'object' &&
      perGameSetting !== null &&
      !Array.isArray(perGameSetting)
    ) {
      return perGameSetting.maxAchievementUnlocks || null
    }
    return null
  } catch (error) {
    handleError('getMaxAchievementUnlocks', error)
    return null
  }
}

// Remove a game from the unlocker list
const removeGameFromUnlockerList = async (gameId: number) => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    const achievementUnlockerList = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'achievementUnlockerList',
    })

    const updatedAchievementUnlocker = achievementUnlockerList.list_data.filter(
      arr => arr.appid !== gameId,
    )

    await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: 'achievementUnlockerList',
      newList: updatedAchievementUnlocker,
    })
  } catch (error) {
    handleError('removeGameFromUnlockerList', error)
  }
}

// Check whether a game has its own delayBeforeFirstUnlock configured, which makes the
// 2-minute inter-game delay redundant
const gameHasPreDelay = async (steamId: string | undefined, appId: number) => {
  try {
    const customOrder = await invoke<{
      achievement_order: { achievements: Achievement[]; delayBeforeFirstUnlock?: number } | null
    }>('get_achievement_order', { steamId, appId })
    const nextDelay = customOrder.achievement_order?.delayBeforeFirstUnlock
    return typeof nextDelay === 'number' && nextDelay > 0
  } catch {
    return false
  }
}

// Build a projection of the next achievements to unlock and when each will unlock
const buildUpcomingQueue = (
  achievements: AchievementToUnlock[],
  startIndex: number,
  initialDelayMs: number,
  delayMap: Map<string, number>,
  hidden: boolean,
  limit = 5,
) => {
  const queue: UpcomingAchievement[] = []
  const now = Date.now()
  let cumulativeMs = initialDelayMs
  let previousId: string | null = null

  for (let i = startIndex; i < achievements.length && queue.length < limit; i++) {
    const achievement = achievements[i]
    if (hidden && achievement.hidden) continue

    if (previousId !== null) {
      cumulativeMs += delayMap.get(previousId) ?? 0
    }

    queue.push({
      id: achievement.id,
      name: achievement.name,
      iconLocked: achievement.iconLocked,
      percentage: achievement.percentage,
      unlockAt: now + cumulativeMs,
    })

    previousId = achievement.id
  }

  return queue
}

// Start the countdown timer for a specific game's initial delay
const startCountdown = (
  durationInMinutes: number,
  appId: number,
  updateGame: (appId: number, patch: Partial<ActiveGameState>) => void,
) => {
  try {
    const durationInMilliseconds = durationInMinutes * 60000
    let remainingTime = durationInMilliseconds

    const intervalId = setInterval(() => {
      if (remainingTime <= 0) {
        clearInterval(intervalId)
        return
      }

      updateGame(appId, { countdownTimer: formatTime(remainingTime) })
      remainingTime -= 1000
    }, 1000)
  } catch (error) {
    handleError('startCountdown', error)
  }
}

// Wait until within the specified schedule
const waitUntilInSchedule = async (
  scheduleFrom: TimeInputValue,
  scheduleTo: TimeInputValue,
  isMountedRef: React.RefObject<boolean>,
  appId: number,
  updateGame: (appId: number, patch: Partial<ActiveGameState>) => void,
  abortControllerRef: React.RefObject<AbortController>,
) => {
  try {
    updateGame(appId, { isWaitingForSchedule: true })
    while (!isWithinSchedule(scheduleFrom, scheduleTo)) {
      if (!isMountedRef.current) {
        updateGame(appId, { isWaitingForSchedule: false })
        return
      }
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (!isMountedRef.current) {
            clearTimeout(timeoutId)
            reject()
          } else {
            resolve()
          }
        }, 60000)
        abortControllerRef.current.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId)
          reject()
        })
      })
    }
    updateGame(appId, { isWaitingForSchedule: false })
  } catch (error) {
    handleError('waitUntilInSchedule', error)
  }
}

// Check for next task to move on to once farming is complete
const checkForNextTask = async () => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })

    if (!response.settings.achievementUnlocker?.nextTaskCheckbox) {
      return { shouldStartNextTask: false, task: null }
    }

    if (!response.settings.achievementUnlocker?.nextTask) {
      return { shouldStartNextTask: false, task: null }
    }

    const task = response.settings.achievementUnlocker?.nextTask

    return {
      shouldStartNextTask: Boolean(task),
      task,
    }
  } catch (error) {
    handleError('checkForNextTask', error)
    return { shouldStartNextTask: false, task: null }
  }
}

// Delay execution for a specified amount of time
const delay = (
  ms: number,
  isMountedRef: React.RefObject<boolean>,
  abortControllerRef: React.RefObject<AbortController>,
) => {
  try {
    return new Promise<void>((resolve, reject) => {
      const checkInterval = 1000
      let elapsedTime = 0

      const intervalId = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(intervalId)
          reject()
        } else if (elapsedTime >= ms) {
          clearInterval(intervalId)
          resolve()
        }
        elapsedTime += checkInterval
      }, checkInterval)

      abortControllerRef.current.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        reject()
      })
    })
  } catch (error) {
    handleError('delay', error)
    return Promise.reject(error)
  }
}

// Get a random delay between a minimum and maximum value
export function getRandomDelay(min: number, max: number) {
  return Math.floor(Math.random() * ((max - min) * 60 * 1000 + 1)) + min * 60 * 1000
}

// Format time in HH:MM:SS format
export function formatTime(ms: number) {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Handle errors
const handleError = (functionName: string, error: unknown) => {
  if (!error) return
  console.error(`Error in (${functionName}):`, error)
  logEvent(`[Error] in (${functionName}) ${error}`)
}
