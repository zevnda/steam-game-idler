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
import { startAutoIdleGames } from '@/shared/layouts'
import {
  isWithinSchedule,
  logEvent,
  showAccountMismatchToast,
  startIdle,
  stopIdle,
  unlockAchievement,
} from '@/shared/utils'

interface AchievementToUnlock {
  appId: number
  id: string
  gameName: string
  percentage: number
  name?: string
  hidden?: boolean
  skip?: boolean
  delayNextUnlock?: number // <-- add optional delayNextUnlock property
}

export const useAchievementUnlocker = async (
  isInitialDelay: boolean,
  setIsInitialDelay: React.Dispatch<React.SetStateAction<boolean>>,
  setCurrentGame: React.Dispatch<React.SetStateAction<Game | null>>,
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>,
  setAchievementCount: React.Dispatch<React.SetStateAction<number>>,
  setCountdownTimer: React.Dispatch<React.SetStateAction<string>>,
  setIsWaitingForSchedule: React.Dispatch<React.SetStateAction<boolean>>,
  startCardFarming: () => Promise<void>,
  isMountedRef: React.RefObject<boolean>,
  abortControllerRef: React.RefObject<AbortController>,
) => {
  let hasInitialDelayOccurred = !isInitialDelay

  const startAchievementUnlocker = async () => {
    try {
      let currentGame: Game | null = null as Game | null

      const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

      // Retrieve achievement unlocker games
      const achievementUnlockerList = await invoke<InvokeCustomList>('get_custom_lists', {
        steamId: userSummary?.steamId,
        list: 'achievementUnlockerList',
      })

      // Delay for 10 seconds before starting
      if (!hasInitialDelayOccurred) {
        startCountdown(10000 / 60000, setCountdownTimer)
        await delay(10000, isMountedRef, abortControllerRef)
        setIsInitialDelay(false)
        hasInitialDelayOccurred = true
      }

      // Check if there are no games left to unlock achievements for
      if (achievementUnlockerList.list_data.length === 0) {
        if (currentGame !== null) {
          await stopIdle(currentGame?.appid, currentGame.name)
        }

        const nextTask = await checkForNextTask()

        if (nextTask.shouldStartNextTask) {
          if (nextTask.task && nextTask.task === 'cardFarming') {
            await startCardFarming()
            logEvent('[Achievement Unlocker] No games left - moving to next task: ' + nextTask.task)
          }

          if (nextTask.task && nextTask.task === 'autoIdle') {
            await startAutoIdleGames()
            logEvent('[Achievement Unlocker] No games left - moving to next task: ' + nextTask.task)
          }

          return setIsComplete(true)
        } else {
          logEvent('[Achievement Unlocker] No games left - stopping')
          return setIsComplete(true)
        }
      }

      // Fetch achievements for the current game
      const achievementUnlockerGame = achievementUnlockerList.list_data[0]
      const { achievements, game } = await fetchAchievements(
        achievementUnlockerGame,
        setAchievementCount,
      )

      currentGame = game
      setCurrentGame(game)

      // If there are achievements available, begin unlocking them
      if (achievements?.length > 0) {
        await unlockAchievements(
          achievements,
          game,
          setAchievementCount,
          setCountdownTimer,
          setIsWaitingForSchedule,
          isMountedRef,
          abortControllerRef,
        )
      } else {
        await removeGameFromUnlockerList(game.appid)
        logEvent(
          `[Achievement Unlocker] ${game.name} (${game.appid}) has no achievements remaining - removed`,
        )
      }

      // Rerun if component is still mounted - needed check if user stops feature during loop
      if (isMountedRef.current) startAchievementUnlocker()
    } catch (error) {
      handleError('startAchievementUnlocker', error)
    }
  }

  startAchievementUnlocker()
}

// Fetch achievements for the current game
const fetchAchievements = async (
  game: Game,
  setAchievementCount: React.Dispatch<React.SetStateAction<number>>,
) => {
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
        refetch: true,
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

    try {
      const customOrder = await invoke<{
        achievement_order: { achievements: Achievement[] } | null
      }>('get_achievement_order', {
        steamId: userSummary?.steamId,
        appId: game.appid,
      })

      // If we have a custom order, use that order to sort achievements
      if (customOrder.achievement_order?.achievements) {
        logEvent(`Custom achievement order found for ${game.name} (${game.appid}), applying order`)

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
          hidden: achievement.hidden,
        }))
        .sort((a, b) => b.percentage - a.percentage)
    }

    setAchievementCount(maxAchievementUnlocks || orderedAchievements.length)

    return { achievements: orderedAchievements, game }
  } catch (error) {
    handleError('fetchAchievements', error)
    return { achievements: [], game }
  }
}

const unlockAchievements = async (
  achievements: AchievementToUnlock[],
  game: Game,
  setAchievementCount: React.Dispatch<React.SetStateAction<number>>,
  setCountdownTimer: React.Dispatch<React.SetStateAction<string>>,
  setIsWaitingForSchedule: React.Dispatch<React.SetStateAction<boolean>>,
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

    for (const achievement of achievements) {
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
            setIsWaitingForSchedule,
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
          setAchievementCount(prevCount => Math.max(prevCount - 1, 0))
          continue
        }

        // Unlock the achievement
        await unlockAchievement(userSummary?.steamId, game.appid, achievement.id, game.name)
        achievementsRemaining--
        logEvent(`[Achievement Unlocker] Unlocked ${achievement.name} for ${game.name}`)
        setAchievementCount(prevCount => Math.max(prevCount - 1, 0))

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
          break
        }

        // Stop idling and remove game from list if all achievements are unlocked
        if (achievementsRemaining === 0) {
          await stopIdle(game.appid, game.name)
          await removeGameFromUnlockerList(game.appid)
          break
        }

        // Wait for a delay before unlocking the next achievement
        // Use delayNextUnlock from achievement if present, otherwise use a global unlock interval
        let delayMs: number
        if (typeof achievement.delayNextUnlock === 'number' && achievement.delayNextUnlock > 0) {
          delayMs = achievement.delayNextUnlock * 60 * 1000
        } else {
          delayMs = getRandomDelay(interval[0], interval[1])
        }
        startCountdown(delayMs / 60000, setCountdownTimer)
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

// Start the countdown timer
const startCountdown = (
  durationInMinutes: number,
  setCountdownTimer: React.Dispatch<React.SetStateAction<string>>,
) => {
  try {
    const durationInMilliseconds = durationInMinutes * 60000
    let remainingTime = durationInMilliseconds

    const intervalId = setInterval(() => {
      if (remainingTime <= 0) {
        clearInterval(intervalId)
        return
      }

      setCountdownTimer(formatTime(remainingTime))
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
  setIsWaitingForSchedule: React.Dispatch<React.SetStateAction<boolean>>,
  abortControllerRef: React.RefObject<AbortController>,
) => {
  try {
    setIsWaitingForSchedule(true)
    while (!isWithinSchedule(scheduleFrom, scheduleTo)) {
      if (!isMountedRef.current) {
        setIsWaitingForSchedule(false)
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
    setIsWaitingForSchedule(false)
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
