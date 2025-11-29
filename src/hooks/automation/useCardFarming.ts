import type { CardFarmingSettings, Game, GameSettings, InvokeCustomList, InvokeSettings, UserSummary } from '@/types'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { startAutoIdleGames } from '@/hooks/layout/useWindow'
import { checkDrops, getAllGamesWithDrops } from '@/utils/automation'
import { startFarmIdle, stopFarmIdle } from '@/utils/idle'
import { logEvent } from '@/utils/tasks'

export interface GameForFarming {
  appid: number
  name: string
  dropsToCount?: number
  initialDrops?: number
}

export interface GameWithDrops extends GameForFarming {
  appid: number
  name: string
  dropsToCount: number
  initialDrops: number
}

interface DropsCheckResult {
  totalDrops: number
  gamesSet: Set<GameWithDrops>
}

interface GameWithRemainingDrops {
  id: number
  name: string
  remaining: number
}

interface CycleStep {
  action: (gamesSet: Set<GameWithDrops>) => Promise<boolean>
  delay: number
}

export const useCardFarming = async (
  setIsComplete: Dispatch<SetStateAction<boolean>>,
  setIsCardFarming: Dispatch<SetStateAction<boolean>>,
  setTotalDropsRemaining: Dispatch<SetStateAction<number>>,
  setGamesWithDrops: Dispatch<SetStateAction<Set<GameWithDrops>>>,
  startAchievementUnlocker: () => Promise<void>,
  isMountedRef: RefObject<boolean>,
  abortControllerRef: RefObject<AbortController>,
): Promise<() => void> => {
  const cleanup = (): void => {
    isMountedRef.current = false
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const startCardFarming = async (): Promise<void> => {
    try {
      if (!isMountedRef.current) return

      const { totalDrops, gamesSet } = await checkGamesForDrops()

      if (!isMountedRef.current) return

      setTotalDropsRemaining(totalDrops)
      setGamesWithDrops(gamesSet)

      if (isMountedRef.current && gamesSet.size > 0) {
        const success = await beginFarmingCycle(gamesSet, isMountedRef, abortControllerRef)
        if (!success) {
          logEvent('[Card Farming] An error occurred (this error can often be ignored) - stopping')
          return setIsComplete(true)
        }
      } else {
        const nextTask = await checkForNextTask()

        if (nextTask.shouldStartNextTask) {
          if (nextTask.task && nextTask.task === 'achievementUnlocker') {
            await stopFarmIdle(gamesSet)
            setIsCardFarming(false)
            await startAchievementUnlocker()
            logEvent('[Card Farming] No drops remaining - moving to next task: ' + nextTask.task)
          }

          if (nextTask.task && nextTask.task === 'autoIdle') {
            await stopFarmIdle(gamesSet)
            setIsCardFarming(false)
            await startAutoIdleGames()
            logEvent('[Card Farming] No drops remaining - moving to next task: ' + nextTask.task)
          }

          return setIsComplete(true)
        } else {
          logEvent('[Card Farming] No games left - stopping')
          return setIsComplete(true)
        }
      }

      if (isMountedRef.current) {
        await startCardFarming()
      }
    } catch (error) {
      handleError('startCardFarming', error)
    }
  }

  if (isMountedRef.current) {
    startCardFarming().catch(error => handleError('useCardFarming', error))
  }

  return cleanup
}

// Check games for drops and return total drops and games set
const checkGamesForDrops = async (): Promise<DropsCheckResult> => {
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

  const response = await invoke<InvokeSettings>('get_user_settings', {
    steamId: userSummary?.steamId,
  })

  const gameSettings = response.settings.gameSettings || {}
  const credentials = response.settings.cardFarming.credentials
  const allGames = response.settings.cardFarming.allGames
  const blacklist = response.settings.cardFarming.blacklist || []

  const cardFarmingList = await invoke<InvokeCustomList>('get_custom_lists', {
    steamId: userSummary?.steamId,
    list: 'cardFarmingList',
  })

  const gamesSet = new Set<GameWithDrops>()
  let totalDrops = 0

  try {
    if (allGames) {
      const gamesWithDrops = await getAllGamesWithDrops(
        userSummary?.steamId,
        credentials?.sid,
        credentials?.sls,
        credentials?.sma,
      )

      totalDrops = processGamesWithDrops(gamesWithDrops, gamesSet, gameSettings, blacklist)
    } else {
      totalDrops = await processIndividualGames(
        cardFarmingList.list_data,
        gamesSet,
        gameSettings,
        userSummary,
        credentials,
        blacklist,
      )
    }
  } catch (error) {
    handleError('checkGamesForDrops', error)
  }

  return { totalDrops, gamesSet }
}

const processGamesWithDrops = (
  gamesWithDrops: GameWithRemainingDrops[] | Game[],
  gamesSet: Set<GameWithDrops>,
  gameSettings: GameSettings,
  blacklist: number[],
): number => {
  let totalDrops = 0

  if (gamesWithDrops) {
    for (const gameData of gamesWithDrops) {
      if (gamesSet.size < 32) {
        // Check if this is a GameWithRemainingDrops or a Game
        const isGameWithDrops = 'remaining' in gameData && 'id' in gameData
        const gameId = isGameWithDrops ? Number(gameData.id) : Number(gameData.appid)
        const gameName = gameData.name
        const remaining = isGameWithDrops ? gameData.remaining : 0

        // Skip if game is blacklisted
        if (blacklist.includes(gameId)) {
          continue
        }

        const gameSetting = gameSettings[gameId]
        let maxCardDrops = remaining
        if (typeof gameSetting === 'object' && gameSetting !== null && !Array.isArray(gameSetting)) {
          maxCardDrops = gameSetting.maxCardDrops ?? remaining
        }
        const dropsToCount = Math.min(remaining, maxCardDrops)

        gamesSet.add({
          appid: gameId,
          name: gameName,
          dropsToCount,
          initialDrops: remaining,
        })

        totalDrops += dropsToCount
        logEvent(`[Card Farming] ${dropsToCount} drops remaining for ${gameName} - starting`)
      } else {
        break
      }
    }
  }
  return totalDrops
}

const processIndividualGames = async (
  cardFarmingList: Game[],
  gamesSet: Set<GameWithDrops>,
  gameSettings: GameSettings,
  userSummary: UserSummary,
  credentials: CardFarmingSettings['credentials'],
  blacklist: number[],
): Promise<number> => {
  let totalDrops = 0
  const TIMEOUT = 30000

  const checkGame = async (gameData: Game): Promise<void> => {
    if (gamesSet.size >= 32) return

    // Skip if game is blacklisted
    if (blacklist.includes(gameData.appid)) {
      return
    }

    const timeoutPromise = new Promise<number>((_, reject) => setTimeout(() => reject(), TIMEOUT))

    try {
      const dropsRemaining = await Promise.race<number>([
        checkDrops(userSummary?.steamId, gameData.appid, credentials?.sid, credentials?.sls, credentials?.sma),
        timeoutPromise,
      ])

      if (dropsRemaining > 0) {
        const gameSetting = gameSettings[gameData.appid]
        let maxCardDrops = dropsRemaining
        if (typeof gameSetting === 'object' && gameSetting !== null && !Array.isArray(gameSetting)) {
          maxCardDrops = gameSetting.maxCardDrops ?? dropsRemaining
        }
        const dropsToCount = Math.min(Number(dropsRemaining), Number(maxCardDrops))

        gamesSet.add({
          appid: gameData.appid,
          name: gameData.name,
          dropsToCount,
          initialDrops: dropsRemaining,
        })

        totalDrops += dropsToCount
        logEvent(`[Card Farming] ${dropsToCount} drops remaining for ${gameData.name} - starting`)
      } else {
        logEvent(`[Card Farming] ${dropsRemaining} drops remaining for ${gameData.name} - removed from list`)
        removeGameFromFarmingList(gameData.appid)
      }
    } catch (error) {
      handleError('checkGame', error)
    }
  }

  await Promise.all(cardFarmingList.map(checkGame))
  return totalDrops
}

// Begin the cycle of farming for all games in the set
export const beginFarmingCycle = async (
  gamesSet: Set<GameWithDrops>,
  isMountedRef: RefObject<boolean>,
  abortControllerRef: RefObject<AbortController>,
): Promise<boolean> => {
  const delays = {
    farming: 60000 * 30,
    short: 15000,
    medium: 60000,
    long: 60000 * 5,
  }

  if (!isMountedRef.current || gamesSet.size < 1) {
    return false
  }

  const cycleSteps: CycleStep[] = [
    { action: startFarmIdle, delay: delays.long },
    { action: stopFarmIdle, delay: delays.medium },
    { action: startFarmIdle, delay: delays.short },
    { action: stopFarmIdle, delay: delays.medium },
    { action: startFarmIdle, delay: delays.farming },
    { action: stopFarmIdle, delay: delays.medium },
    { action: startFarmIdle, delay: delays.short },
    { action: stopFarmIdle, delay: delays.medium },
  ]

  try {
    for (const step of cycleSteps) {
      if (!isMountedRef.current) {
        return false
      }

      const success = await step.action(gamesSet)

      if (success) {
        await delay(step.delay, isMountedRef, abortControllerRef)

        if (step.action === stopFarmIdle) {
          gamesSet = await checkDropsRemaining(gamesSet)

          // Check if we should add more games to the list
          if (gamesSet.size < 32) {
            const { gamesSet: refreshedSet } = await checkGamesForDrops()
            for (const game of refreshedSet) {
              if (gamesSet.size >= 32) break
              if (![...gamesSet].some(g => g.appid === game.appid)) {
                gamesSet.add(game)
              }
            }
          }
        }
      } else {
        return false
      }
    }
    return true
  } catch (error) {
    console.error('Error in (beginFarmingCycle) - "undefined" can be ignored', error)
    await stopFarmIdle(gamesSet)
    return false
  }
}

// Periodically check if there are still drops remaining for each game
const checkDropsRemaining = async (gameSet: Set<GameWithDrops>): Promise<Set<GameWithDrops>> => {
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

  const updatedGameSet = new Set<GameWithDrops>()
  const gameArray = Array.from(gameSet)

  const checkDropsPromises = gameArray.map(async game => {
    try {
      const response = await invoke<InvokeSettings>('get_user_settings', {
        steamId: userSummary?.steamId,
      })
      const credentials = response.settings.cardFarming.credentials

      const dropsRemaining = await checkDrops(
        userSummary?.steamId,
        game.appid,
        credentials?.sid,
        credentials?.sls,
        credentials?.sma,
      )

      if (dropsRemaining <= 0) {
        removeGameFromFarmingList(Number(game.appid))
        logEvent(`[Card Farming] Farmed all drops for ${game.name} - removed from list`)
      } else if (game.initialDrops - dropsRemaining >= game.dropsToCount) {
        removeGameFromFarmingList(Number(game.appid))
        logEvent(
          `[Card Farming- maxCardDrops] Farmed ${game.initialDrops - dropsRemaining}/${dropsRemaining} cards for ${game.name} - removed from list`,
        )
      } else {
        updatedGameSet.add(game)
      }
    } catch (error) {
      handleError('checkDropsRemaining', error)
      updatedGameSet.add(game) // Keep the game in the set if there was an error checking
    }
  })

  await Promise.all(checkDropsPromises)

  return updatedGameSet
}

// Remove game from farming list
const removeGameFromFarmingList = async (gameId: number): Promise<void> => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    const cardFarmingList = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'cardFarmingList',
    })

    const updatedCardFarming = cardFarmingList.list_data.filter(arr => arr.appid !== gameId)

    await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: 'cardFarmingList',
      newList: updatedCardFarming,
    })
  } catch (error) {
    handleError('removeGameFromFarmingList', error)
  }
}

// Check for next task to move on to once farming is complete
const checkForNextTask = async (): Promise<{ shouldStartNextTask: boolean; task: string | null }> => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })

    if (!response.settings.cardFarming?.nextTaskCheckbox) {
      return { shouldStartNextTask: false, task: null }
    }

    if (!response.settings.cardFarming?.nextTask) {
      return { shouldStartNextTask: false, task: null }
    }

    const task = response.settings.cardFarming?.nextTask

    return {
      shouldStartNextTask: Boolean(task),
      task,
    }
  } catch (error) {
    handleError('checkForNextTask', error)
    return { shouldStartNextTask: false, task: null }
  }
}

// Delay function
const delay = (
  ms: number,
  isMountedRef: RefObject<boolean>,
  abortControllerRef: RefObject<AbortController>,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (!isMountedRef.current) {
      return reject()
    }

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

    const abortHandler = (): void => {
      clearInterval(intervalId)
      reject()
    }

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
      resolve()
    }, ms)

    abortControllerRef.current.signal.addEventListener('abort', abortHandler)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
      abortControllerRef.current.signal.removeEventListener('abort', abortHandler)
    }
  })
}

// Handle cancel action
export const handleCancel = async (
  gamesWithDrops: Set<GameWithDrops>,
  isMountedRef: RefObject<boolean>,
  abortControllerRef: RefObject<AbortController>,
): Promise<void> => {
  try {
    await stopFarmIdle(gamesWithDrops)
  } catch (error) {
    handleError('handleCancel', error)
  } finally {
    isMountedRef.current = false
    abortControllerRef.current.abort()
  }
}

// Handle errors
const handleError = (functionName: string, error: unknown): void => {
  if (!error) return
  console.error(`Error in (${functionName}):`, error)
  logEvent(`[Error] in (${functionName}) ${error}`)
}
