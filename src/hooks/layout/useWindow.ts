import type {
  Game,
  InvokeCustomList,
  InvokeFreeGames,
  InvokeRunningProcess,
  InvokeSettings,
  UserSummary,
} from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'

import { useCallback, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'

import { useIdleContext } from '@/components/contexts/IdleContext'
import { useStateContext } from '@/components/contexts/StateContext'
import { useUpdateContext } from '@/components/contexts/UpdateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import { startIdle } from '@/utils/idle'
import { checkSteamStatus, fetchLatest, logEvent, preserveKeysAndClearData } from '@/utils/tasks'
import { showDangerToast, t } from '@/utils/toasts'

export default function useWindow(): void {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { setIdleGamesList } = useIdleContext()
  const {
    setIsDarkMode,
    setShowFreeGamesTab,
    setIsCardFarming,
    setIsAchievementUnlocker,
    setShowSteamWarning,
    setUseBeta,
  } = useStateContext()
  const { setUpdateAvailable, setShowChangelog } = useUpdateContext()
  const { userSummary, setUserSummary, userSettings, setUserSettings, setFreeGamesList } = useUserContext()

  console.error('Monitor for rerenders')

  useEffect(() => {
    emit('ready')
  }, [])

  useEffect(() => {
    setUseBeta(userSettings.general.useBeta)
  }, [userSettings.general.useBeta, setUseBeta])

  // TODO: remove once users are migrated to the new settings
  // Temp fix to remove old data stores from localStorage
  useEffect(() => {
    localStorage.removeItem('settings')
    localStorage.removeItem('steamCookies')
    localStorage.removeItem('cardFarmingListCache')
    localStorage.removeItem('achievementUnlockerListCache')
    localStorage.removeItem('autoIdleListCache')
    localStorage.removeItem('favoritesListCache')
    localStorage.removeItem('gameSettings')
    localStorage.removeItem('cardFarmingUser')
  }, [])

  useEffect(() => {
    const getAndSetUserSettings = async (): Promise<void> => {
      if (userSummary) {
        const response = await invoke<InvokeSettings>('get_user_settings', {
          steamId: userSummary.steamId,
        })
        setUserSettings(response.settings)
      }
    }
    getAndSetUserSettings()
  }, [userSummary, setUserSettings])

  useEffect(() => {
    // Set dark mode based on the current theme
    const darkThemes = ['dark', 'slate', 'oled']
    setIsDarkMode(darkThemes.includes(String(theme)))
  }, [theme, setIsDarkMode])

  useEffect(() => {
    // Check for updates - immediate update for major, or show notification
    const checkForUpdates = async (): Promise<void> => {
      try {
        const update = await check()
        if (update?.available) {
          const latest = await fetchLatest()
          if (latest?.major) {
            localStorage.setItem('hasUpdated', 'true')
            await invoke('kill_all_steamutil_processes')
            await update.downloadAndInstall()
            await preserveKeysAndClearData()
            await relaunch()
          } else {
            setUpdateAvailable(true)
          }
        }
      } catch (error) {
        showDangerToast(t('toast.checkUpdate.error'))
        console.error('Error in (checkForUpdates):', error)
        logEvent(`Error in (checkForUpdates): ${error}`)
      }
    }
    checkForUpdates()
    const intervalId = setInterval(checkForUpdates, 5000 * 60)
    return () => {
      clearInterval(intervalId)
    }
  }, [setUpdateAvailable, t])

  useEffect(() => {
    // Monitor if Steam client is running - stop features if Steam closes
    // and show a modal to the user
    const checkSteamStatusInt = async (): Promise<void> => {
      try {
        const isSteamRunning = await checkSteamStatus()
        if (!isSteamRunning && userSummary) {
          await invoke('kill_all_steamutil_processes')
          setIsCardFarming(false)
          setIsAchievementUnlocker(false)
          setShowSteamWarning(true)
        }
      } catch (error) {
        console.error('Error in (checkSteamStatusInt):', error)
        logEvent(`Error in (checkSteamStatusInt): ${error}`)
      }
    }
    checkSteamStatusInt()
    const intervalId = setInterval(checkSteamStatusInt, 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [userSummary, setIsAchievementUnlocker, setIsCardFarming, setShowSteamWarning])

  useEffect(() => {
    // Show changelog after updates
    const hasUpdated = localStorage.getItem('hasUpdated')
    if (hasUpdated) {
      localStorage.removeItem('hasUpdated')
      setShowChangelog(true)
    }
  }, [setShowChangelog])

  useEffect(() => {
    // Track games that are being idled
    const fetchRunningProcesses = async (): Promise<void> => {
      try {
        const response = await invoke<InvokeRunningProcess>('get_running_processes')
        const processes = response?.processes

        setIdleGamesList((prevList: Game[]) => {
          if (prevList.length !== processes.length) {
            return processes.map(process => {
              const existingGame = prevList.find(game => game.appid === process.appid)
              return {
                ...process,
                // Track start time for idle timer
                startTime: existingGame?.startTime || Date.now(),
              }
            })
          }

          // Only update if the list of games has actually changed
          const prevMap = new Map(prevList.map(item => [item.appid, item]))
          const newMap = new Map(processes.map(item => [item.appid, item]))

          if (prevList.some(item => !newMap.has(item.appid)) || processes.some(item => !prevMap.has(item.appid))) {
            return processes
          }

          return prevList
        })
      } catch (error) {
        console.error('Error fetching running processes:', error)
      }
    }

    fetchRunningProcesses()
    const intervalId = setInterval(fetchRunningProcesses, 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [setIdleGamesList])

  const freeGamesCheck = useCallback((): void => {
    checkForFreeGames(setFreeGamesList, setShowFreeGamesTab)
  }, [setFreeGamesList, setShowFreeGamesTab])

  useEffect(() => {
    // Check for free games
    freeGamesCheck()

    const intervalId = setInterval(freeGamesCheck, 60000 * 60)
    return () => clearInterval(intervalId)
  }, [userSummary?.steamId, freeGamesCheck])

  useEffect(() => {
    // Set user summary data
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    if (userSummary?.steamId) {
      setUserSummary(userSummary)
    }

    // Start idling games in auto idle list
    startAutoIdleGames()
  }, [setUserSummary])
}

// Check for free games
export const checkForFreeGames = async (
  setFreeGamesList: Dispatch<SetStateAction<Game[]>>,
  setShowFreeGamesTab: Dispatch<SetStateAction<boolean>>,
): Promise<void> => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (!userSummary?.steamId) return

    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })
    const settings = response.settings

    const freeGameNotifications = settings.general.freeGameNotifications
    const freeGamesList = await getFreeGames()

    if (!freeGamesList) return

    // Compare the new free games with the old ones
    const oldFreeGamesIdsStr = localStorage.getItem('freeGamesIds')
    const oldFreeGameIds: number[] = oldFreeGamesIdsStr ? JSON.parse(oldFreeGamesIdsStr) : []
    const newFreeGameIds: number[] = freeGamesList.games.map(game => Number(game.appid))

    // Show free games tab if there are any
    if (freeGamesList.games.length > 0) {
      setFreeGamesList(freeGamesList.games)
      setShowFreeGamesTab(true)

      // Sort the arrays before comparing to ignore order differences
      const sortedOldIds = [...oldFreeGameIds].sort((a, b) => a - b)
      const sortedNewIds = [...newFreeGameIds].sort((a, b) => a - b)

      // Only notify if the list of free games has changed
      if (JSON.stringify(sortedOldIds) !== JSON.stringify(sortedNewIds)) {
        localStorage.setItem('freeGamesIds', JSON.stringify(newFreeGameIds))
        if (freeGameNotifications) {
          sendNativeNotification('Free Games Available!', 'Check the sidebar for the 🎁 icon to get your free games')
        }
      }
    } else {
      localStorage.setItem('freeGamesIds', JSON.stringify([]))
      setFreeGamesList([])
      setShowFreeGamesTab(false)
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (checkForFreeGames):', error)
    logEvent(`[Error] in (checkForFreeGames): ${error}`)
  }
}

// Start idling games in auto idle list
export const startAutoIdleGames = async (): Promise<void> => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (!userSummary?.steamId) return

    // Check if Steam is running
    const isSteamRunning = await checkSteamStatus()
    if (!isSteamRunning) {
      const checkInterval = setInterval(async () => {
        const steamRunning = await checkSteamStatus()
        if (steamRunning) {
          clearInterval(checkInterval)
          setTimeout(async () => {
            await startAutoIdleGamesImpl(userSummary.steamId)
          }, 15000)
        }
      }, 10000)

      setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval)
        }
      }, 300000)

      return
    }

    // Steam is running, proceed with idling
    await startAutoIdleGamesImpl(userSummary.steamId)
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (startAutoIdleGames):', error)
    logEvent(`[Error] in (startAutoIdleGames): ${error}`)
  }
}

async function startAutoIdleGamesImpl(steamId: string): Promise<void> {
  try {
    const customLists = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId,
      list: 'autoIdleList',
    })

    if (!customLists.error && customLists.list_data.length > 0) {
      const autoIdleGames = customLists.list_data
      const gameIds = autoIdleGames.map(game => game.appid)

      // Get currently running games to avoid starting duplicates
      const response = await invoke<InvokeRunningProcess>('get_running_processes')
      const processes = response?.processes
      const runningIdlers = processes.map(p => p.appid)

      // Start idling games that are not already idling
      const gamesToIdle = gameIds.filter(id => !runningIdlers.includes(id))
      for (const appid of gamesToIdle) {
        const game = autoIdleGames.find(g => g.appid === appid)
        if (game && !runningIdlers.includes(appid)) {
          await startIdle(game.appid, game.name, true)
        }
      }
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (startAutoIdleGamesImpl):', error)
    logEvent(`[Error] in (startAutoIdleGamesImpl): ${error}`)
  }
}

// Get free games
async function getFreeGames(): Promise<InvokeFreeGames | null> {
  try {
    const response = await invoke<InvokeFreeGames>('get_free_games')
    return response || null
  } catch (error) {
    console.error('Error in (getFreeGames):', error)
    logEvent(`[Error] in (getFreeGames): ${error}`)
    return null
  }
}

// Send a native notification
async function sendNativeNotification(title: string, body: string): Promise<void> {
  try {
    let permissionGranted = await isPermissionGranted()

    // Request permission if not granted
    if (!permissionGranted) {
      const permission = await requestPermission()
      permissionGranted = permission === 'granted'
    }

    if (permissionGranted) {
      sendNotification({ title, body })
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (sendNativeNotification):', error)
    logEvent(`[Error] in (sendNativeNotification): ${error}`)
  }
}
