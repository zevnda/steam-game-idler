import type {
  CardFarmingSettings,
  Game,
  GameSettings,
  GameWithRemainingDrops,
  InvokeCustomList,
  InvokeSettings,
  UserSummary,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import {
  checkDrops,
  getAllGamesWithDrops,
  logEvent,
  startAutoIdleGames,
  startFarmIdle,
  stopFarmIdle,
  stopFarmIdleGame,
} from '@/shared/utils'

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

interface CycleStep {
  action: (gamesSet: Set<GameWithDrops>) => Promise<boolean>
  delay: number
}

// Track when each game started farming by appid
const farmStartTimes: { [appId: number]: number } = {}

const clearFarmStartTime = (appId: number) => {
  delete farmStartTimes[appId]
}

// Real-time per-game maxCardFarmingTime timers
const farmTimeouts: { [appId: number]: ReturnType<typeof setTimeout> } = {}

// Appids whose farm process was just killed by a real-time timer but haven't
// yet been filtered out of the in-flight beginFarmingCycle gamesSet.
const expiredFarmAppIds = new Set<number>()

const clearFarmTimeout = (appId: number) => {
  if (farmTimeouts[appId]) {
    clearTimeout(farmTimeouts[appId])
    delete farmTimeouts[appId]
  }
}

// Schedules exactly one live timer per appid, using the
const ensureFarmTimeout = (appId: number, appName: string, maxCardFarmingTime: number) => {
  if (farmTimeouts[appId]) return
  const elapsedMs = appId in farmStartTimes ? Date.now() - farmStartTimes[appId] : 0
  const remainingMs = Math.max(0, maxCardFarmingTime * 60000 - elapsedMs)
  farmTimeouts[appId] = setTimeout(() => handleFarmTimeExpired(appId, appName), remainingMs)
}

// Fires exactly when maxCardFarmingTime elapses. Kills just that game's farm
// process in real time
const handleFarmTimeExpired = async (appId: number, appName: string) => {
  try {
    expiredFarmAppIds.add(appId)
    await stopFarmIdleGame(appId, appName)
    removeGameFromFarmingList(appId)
  } catch (error) {
    handleError('handleFarmTimeExpired', error)
  } finally {
    // Do NOT clear farmStartTimes here -- it must keep reading as
    // "elapsed >= cap" for allGames-mode
    clearFarmTimeout(appId)
  }
}

export const useCardFarming = async (
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>,
  setIsCardFarming: (value: boolean) => void,
  setTotalDropsRemaining: React.Dispatch<React.SetStateAction<number>>,
  setGamesWithDrops: React.Dispatch<React.SetStateAction<Set<GameWithDrops>>>,
  startAchievementUnlocker: () => Promise<void>,
  isMountedRef: React.RefObject<boolean>,
  abortControllerRef: React.RefObject<AbortController>,
) => {
  const cleanup = () => {
    isMountedRef.current = false
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const syncFarmingUI = (updatedSet: Set<GameWithDrops>) => {
    setGamesWithDrops(new Set(updatedSet))
    setTotalDropsRemaining(Array.from(updatedSet).reduce((sum, game) => sum + game.dropsToCount, 0))
  }

  const startCardFarming = async () => {
    try {
      if (!isMountedRef.current) return

      const { totalDrops, gamesSet } = await checkGamesForDrops()

      if (!isMountedRef.current) return

      setTotalDropsRemaining(totalDrops)
      setGamesWithDrops(gamesSet)

      if (isMountedRef.current && gamesSet.size > 0) {
        const success = await beginFarmingCycle(
          gamesSet,
          isMountedRef,
          abortControllerRef,
          syncFarmingUI,
        )
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
const checkGamesForDrops = async () => {
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

  const response = await invoke<InvokeSettings>('get_user_settings', {
    steamId: userSummary?.steamId,
  })

  const gameSettings = response.settings.gameSettings || {}
  const credentials = response.settings.cardFarming.credentials
  const allGames = response.settings.cardFarming.allGames
  const blacklist = response.settings.cardFarming.blacklist || []
  const skipNoPlaytime = response.settings.cardFarming.skipNoPlaytime || false
  const farmUnplayedOnly = response.settings.cardFarming.farmUnplayedOnly || false
  const sortByHighestDrops = response.settings.cardFarming.sortByHighestDrops || false
  const sortByLowestDrops = response.settings.cardFarming.sortByLowestDrops || false

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

      totalDrops = processGamesWithDrops(
        gamesWithDrops,
        gamesSet,
        gameSettings,
        blacklist,
        skipNoPlaytime,
        farmUnplayedOnly,
        sortByHighestDrops,
        sortByLowestDrops,
      )
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
  skipNoPlaytime: boolean,
  farmUnplayedOnly: boolean,
  sortByHighestDrops: boolean,
  sortByLowestDrops: boolean,
) => {
  let totalDrops = 0

  // Sort the games list by drop count if a sort option is enabled
  const sortedGames = gamesWithDrops ? [...gamesWithDrops] : []
  if (sortByHighestDrops) {
    sortedGames.sort((a, b) => {
      const aRemaining = 'remaining' in a ? (a.remaining ?? 0) : 0
      const bRemaining = 'remaining' in b ? (b.remaining ?? 0) : 0
      return bRemaining - aRemaining
    })
  } else if (sortByLowestDrops) {
    sortedGames.sort((a, b) => {
      const aRemaining = 'remaining' in a ? (a.remaining ?? 0) : 0
      const bRemaining = 'remaining' in b ? (b.remaining ?? 0) : 0
      return aRemaining - bRemaining
    })
  }

  if (sortedGames.length > 0) {
    for (const gameData of sortedGames) {
      if (gamesSet.size < 32) {
        // Check if this is a GameWithRemainingDrops or a Game
        const isGameWithDrops = 'remaining' in gameData && 'id' in gameData
        const gameId = isGameWithDrops ? Number(gameData.id) : Number(gameData.appid)
        const gameName = gameData.name
        const remaining = isGameWithDrops ? gameData.remaining : 0
        const playtime = isGameWithDrops ? gameData.playtime : 0

        // Skip if game is blacklisted
        if (blacklist.includes(gameId)) {
          logEvent(`[Card Farming] Skipping ${gameName} (${gameId}) because it is blacklisted`)
          continue
        }

        // Remove games with 0 playtime if 'skipNoPlaytime' is enabled
        if (skipNoPlaytime && playtime <= 0) {
          logEvent(`[Card Farming] Skipping ${gameName} (${gameId}) due to zero playtime`)
          continue
        }

        // Only farm games with 0 playtime if 'farmUnplayedOnly' is enabled
        if (farmUnplayedOnly && playtime > 0) {
          logEvent(`[Card Farming] Skipping ${gameName} (${gameId}) - only farming unplayed games`)
          continue
        }

        const gameSetting = gameSettings[gameId]
        let maxCardDrops = remaining
        let maxCardFarmingTime = 0
        if (
          typeof gameSetting === 'object' &&
          gameSetting !== null &&
          !Array.isArray(gameSetting)
        ) {
          maxCardDrops = gameSetting.maxCardDrops ?? remaining
          maxCardFarmingTime = gameSetting.maxCardFarmingTime ?? 0
        }

        // Check for globalMaxCardFarmingTime first
        const globalMaxCardFarmingTime =
          typeof gameSettings.globalMaxCardFarmingTime === 'number'
            ? gameSettings.globalMaxCardFarmingTime
            : 0
        if (globalMaxCardFarmingTime > 0) {
          maxCardFarmingTime = globalMaxCardFarmingTime
        }

        if (maxCardFarmingTime > 0) {
          if (!(gameId in farmStartTimes)) {
            farmStartTimes[gameId] = Date.now()
          }
          const elapsedMs = Date.now() - farmStartTimes[gameId]
          if (elapsedMs >= maxCardFarmingTime * 60000) {
            logEvent(
              `[Card Farming- maxCardFarmingTime] Farmed ${gameName} (${gameId}) for ${Math.round(elapsedMs / 60000)} min (limit ${maxCardFarmingTime} min) - removed from list`,
            )
            removeGameFromFarmingList(gameId)
            clearFarmStartTime(gameId)
            clearFarmTimeout(gameId)
            continue
          }
          ensureFarmTimeout(gameId, gameName, maxCardFarmingTime)
        } else {
          clearFarmStartTime(gameId)
          clearFarmTimeout(gameId)
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
) => {
  let totalDrops = 0
  const TIMEOUT = 30000

  const checkGame = async (gameData: Game) => {
    if (gamesSet.size >= 32) return

    // Skip if game is blacklisted
    if (blacklist.includes(gameData.appid)) {
      logEvent(
        `[Card Farming] Skipping ${gameData.name} (${gameData.appid}) because it is blacklisted`,
      )
      return
    }

    const timeoutPromise = new Promise<number>((_, reject) => setTimeout(() => reject(), TIMEOUT))

    try {
      const dropsRemaining = await Promise.race<number>([
        checkDrops(
          userSummary?.steamId,
          gameData.appid,
          credentials?.sid,
          credentials?.sls,
          credentials?.sma,
        ),
        timeoutPromise,
      ])

      if (dropsRemaining > 0) {
        const gameSetting = gameSettings[gameData.appid]
        let maxCardDrops = dropsRemaining
        let maxCardFarmingTime = 0
        if (
          typeof gameSetting === 'object' &&
          gameSetting !== null &&
          !Array.isArray(gameSetting)
        ) {
          maxCardDrops = gameSetting.maxCardDrops ?? dropsRemaining
          maxCardFarmingTime = gameSetting.maxCardFarmingTime ?? 0
        }

        // Check for globalMaxCardFarmingTime first
        const globalMaxCardFarmingTime =
          typeof gameSettings.globalMaxCardFarmingTime === 'number'
            ? gameSettings.globalMaxCardFarmingTime
            : 0
        if (globalMaxCardFarmingTime > 0) {
          maxCardFarmingTime = globalMaxCardFarmingTime
        }

        if (maxCardFarmingTime > 0) {
          if (!(gameData.appid in farmStartTimes)) {
            farmStartTimes[gameData.appid] = Date.now()
          }
          const elapsedMs = Date.now() - farmStartTimes[gameData.appid]
          if (elapsedMs >= maxCardFarmingTime * 60000) {
            logEvent(
              `[Card Farming- maxCardFarmingTime] Farmed ${gameData.name} (${gameData.appid}) for ${Math.round(elapsedMs / 60000)} min (limit ${maxCardFarmingTime} min) - removed from list`,
            )
            removeGameFromFarmingList(gameData.appid)
            clearFarmStartTime(gameData.appid)
            clearFarmTimeout(gameData.appid)
            return
          }
          ensureFarmTimeout(gameData.appid, gameData.name, maxCardFarmingTime)
        } else {
          clearFarmStartTime(gameData.appid)
          clearFarmTimeout(gameData.appid)
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
        logEvent(
          `[Card Farming] ${dropsRemaining} drops remaining for ${gameData.name} - removed from list`,
        )
        removeGameFromFarmingList(gameData.appid)
        clearFarmStartTime(gameData.appid)
        clearFarmTimeout(gameData.appid)
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
  isMountedRef: React.RefObject<boolean>,
  abortControllerRef: React.RefObject<AbortController>,
  onGamesSetChange?: (updatedSet: Set<GameWithDrops>) => void,
) => {
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

      // Drop any games whose farm process was just killed
      if (expiredFarmAppIds.size > 0) {
        for (const game of Array.from(gamesSet)) {
          if (expiredFarmAppIds.has(game.appid)) {
            gamesSet.delete(game)
            expiredFarmAppIds.delete(game.appid)
          }
        }
      }

      // No games left to farm -- stop the cycle now instead of running
      // through the remaining scheduled steps on an empty set.
      if (gamesSet.size < 1) {
        return true
      }

      const success = await step.action(gamesSet)

      if (success) {
        await delay(step.delay, isMountedRef, abortControllerRef, gamesSet, onGamesSetChange)

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

          onGamesSetChange?.(gamesSet)
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
const checkDropsRemaining = async (gameSet: Set<GameWithDrops>) => {
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

  const updatedGameSet = new Set<GameWithDrops>()
  const gameArray = Array.from(gameSet)

  const checkDropsPromises = gameArray.map(async game => {
    try {
      const response = await invoke<InvokeSettings>('get_user_settings', {
        steamId: userSummary?.steamId,
      })
      const credentials = response.settings.cardFarming.credentials
      const gameSettings = response.settings.gameSettings || {}

      const dropsRemaining = await checkDrops(
        userSummary?.steamId,
        game.appid,
        credentials?.sid,
        credentials?.sls,
        credentials?.sma,
      )

      const gameSetting = gameSettings[game.appid]
      let maxCardFarmingTime = 0
      if (typeof gameSetting === 'object' && gameSetting !== null && !Array.isArray(gameSetting)) {
        maxCardFarmingTime = gameSetting.maxCardFarmingTime ?? 0
      }

      // Check for globalMaxCardFarmingTime first
      const globalMaxCardFarmingTime =
        typeof gameSettings.globalMaxCardFarmingTime === 'number'
          ? gameSettings.globalMaxCardFarmingTime
          : 0
      if (globalMaxCardFarmingTime > 0) {
        maxCardFarmingTime = globalMaxCardFarmingTime
      }

      const elapsedMs = game.appid in farmStartTimes ? Date.now() - farmStartTimes[game.appid] : 0

      if (dropsRemaining <= 0) {
        removeGameFromFarmingList(Number(game.appid))
        clearFarmStartTime(game.appid)
        clearFarmTimeout(game.appid)
        logEvent(`[Card Farming] Farmed all drops for ${game.name} - removed from list`)
      } else if (game.initialDrops - dropsRemaining >= game.dropsToCount) {
        removeGameFromFarmingList(Number(game.appid))
        clearFarmStartTime(game.appid)
        clearFarmTimeout(game.appid)
        logEvent(
          `[Card Farming- maxCardDrops] Farmed ${game.initialDrops - dropsRemaining}/${dropsRemaining} cards for ${game.name} - removed from list`,
        )
      } else if (maxCardFarmingTime > 0 && elapsedMs >= maxCardFarmingTime * 60000) {
        removeGameFromFarmingList(Number(game.appid))
        clearFarmStartTime(game.appid)
        clearFarmTimeout(game.appid)
        logEvent(
          `[Card Farming- maxCardFarmingTime] Farmed ${game.name} for ${Math.round(elapsedMs / 60000)}/${maxCardFarmingTime} min - removed from list`,
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
const removeGameFromFarmingList = async (gameId: number) => {
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
const checkForNextTask = async () => {
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
  isMountedRef: React.RefObject<boolean>,
  abortControllerRef: React.RefObject<AbortController>,
  gamesSet?: Set<GameWithDrops>,
  onGamesSetChange?: (updatedSet: Set<GameWithDrops>) => void,
) => {
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
        return
      }

      // Prune any games whose farm process was just killed by maxCardFarmingTime timer
      if (gamesSet) {
        let pruned = false
        for (const game of Array.from(gamesSet)) {
          if (expiredFarmAppIds.has(game.appid)) {
            gamesSet.delete(game)
            expiredFarmAppIds.delete(game.appid)
            pruned = true
          }
        }

        if (pruned) {
          onGamesSetChange?.(gamesSet)
        }

        if (gamesSet.size === 0) {
          clearInterval(intervalId)
          clearTimeout(timeoutId)
          resolve()
          return
        }
      }

      if (elapsedTime >= ms) {
        clearInterval(intervalId)
        resolve()
      }
      elapsedTime += checkInterval
    }, checkInterval)

    const abortHandler = () => {
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
  isMountedRef: React.RefObject<boolean>,
  abortControllerRef: React.RefObject<AbortController>,
) => {
  try {
    await stopFarmIdle(gamesWithDrops)
  } catch (error) {
    handleError('handleCancel', error)
  } finally {
    isMountedRef.current = false
    abortControllerRef.current.abort()
    for (const appId of Object.keys(farmStartTimes)) {
      delete farmStartTimes[Number(appId)]
    }
    for (const appId of Object.keys(farmTimeouts)) {
      clearFarmTimeout(Number(appId))
    }
    expiredFarmAppIds.clear()
  }
}

// Handle errors
const handleError = (functionName: string, error: unknown) => {
  if (!error) return
  console.error(`Error in (${functionName}):`, error)
  logEvent(`[Error] in (${functionName}) ${error}`)
}
