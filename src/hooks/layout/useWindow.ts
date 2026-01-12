import type { GamesListHook } from '@/hooks/gameslist/useGamesList'
import type {
  Game,
  InvokeCustomList,
  InvokeFreeGames,
  InvokeRedeemFreeGame,
  InvokeRunningProcess,
  InvokeSettings,
  UserSummary,
} from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'
import { Menu, MenuItem } from '@tauri-apps/api/menu'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useIdleStore } from '@/stores/idleStore'
import { useStateStore } from '@/stores/stateStore'
import { useUpdateStore } from '@/stores/updateStore'
import { useUserStore } from '@/stores/userStore'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'

import useGamesList from '@/hooks/gameslist/useGamesList'
import { handleRefetch } from '@/hooks/gameslist/usePageHeader'
import { startIdle } from '@/utils/idle'
import { checkSteamStatus, fetchLatest, isPortableCheck, logEvent, preserveKeysAndClearData } from '@/utils/tasks'
import { showDangerToast, showNoGamesToast, showSuccessToast, t } from '@/utils/toasts'

export default function useWindow(): void {
  const { t } = useTranslation()
  const { setTheme } = useTheme()
  const gamesContext = useGamesList()
  const setIdleGamesList = useIdleStore(state => state.setIdleGamesList)
  const setIsCardFarming = useStateStore(state => state.setIsCardFarming)
  const setIsAchievementUnlocker = useStateStore(state => state.setIsAchievementUnlocker)
  const setShowSteamWarning = useStateStore(state => state.setShowSteamWarning)
  const setUseBeta = useStateStore(state => state.setUseBeta)
  const setLoadingUserSummary = useStateStore(state => state.setLoadingUserSummary)
  const setUpdateAvailable = useUpdateStore(state => state.setUpdateAvailable)
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const freeGamesList = useUserStore(state => state.freeGamesList)
  const setFreeGamesList = useUserStore(state => state.setFreeGamesList)
  const gamesList = useUserStore(state => state.gamesList)
  const [zoom, setZoom] = useState(1.0)

  const lastRedeemedIdsRef = useRef<string>('')

  console.debug('Monitor for rerenders')

  useEffect(() => {
    // Emit ready event to backend
    emit('ready')
    // Start the Steam status monitor once globally
    invoke('start_steam_status_monitor')
    // Start the processes monitor once globally
    invoke('start_processes_monitor')
  }, [])

  // Set initial zoom level from localStorage
  useEffect(() => {
    const storedZoom = localStorage.getItem('zoomLevel')
    if (storedZoom) {
      const parsedZoom = parseFloat(storedZoom)
      if (!isNaN(parsedZoom)) {
        setZoom(parsedZoom)
        invoke('set_zoom', { scaleFactor: parsedZoom })
      }
    }
  }, [])

  // Zoom controls
  const handleZoomControls = useCallback(
    async (e: KeyboardEvent) => {
      try {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === '=' || e.key === '+') {
            e.preventDefault()
            const newZoom = Math.min(zoom + 0.1, 1.3)
            setZoom(newZoom)
            localStorage.setItem('zoomLevel', newZoom.toString())
            await invoke('set_zoom', { scaleFactor: newZoom })
          } else if (e.key === '-') {
            e.preventDefault()
            const newZoom = Math.max(zoom - 0.1, 0.7)
            setZoom(newZoom)
            localStorage.setItem('zoomLevel', newZoom.toString())
            await invoke('set_zoom', { scaleFactor: newZoom })
          } else if (e.key === '0') {
            e.preventDefault()
            setZoom(1.0)
            localStorage.setItem('zoomLevel', '1.0')
            await invoke('set_zoom', { scaleFactor: 1.0 })
          }
        }
      } catch (error) {
        showDangerToast(t('common.error'))
        console.error('Error in (handleZoomControls):', error)
        logEvent(`[Error] in (handleZoomControls): ${error}`)
      }
    },
    [zoom, t],
  )

  // Zoom controls - mouse wheel
  const handleWheelZoom = useCallback(
    async (e: WheelEvent) => {
      try {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const delta = e.deltaY > 0 ? -0.1 : 0.1
          const newZoom = Math.min(Math.max(zoom + delta, 0.7), 1.3)
          setZoom(newZoom)
          localStorage.setItem('zoomLevel', newZoom.toString())
          await invoke('set_zoom', { scaleFactor: newZoom })
        }
      } catch (error) {
        showDangerToast(t('common.error'))
        console.error('Error in (handleWheelZoom):', error)
        logEvent(`[Error] in (handleWheelZoom): ${error}`)
      }
    },
    [zoom, t],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleZoomControls, { capture: true })
    return () => document.removeEventListener('keydown', handleZoomControls, { capture: true })
  }, [handleZoomControls])

  useEffect(() => {
    document.addEventListener('wheel', handleWheelZoom, { passive: false })
    return () => document.removeEventListener('wheel', handleWheelZoom)
  }, [handleWheelZoom])

  // Create the context menu once on mount
  useEffect(() => {
    const handleGlobalContextMenu = async (e: MouseEvent) => {
      e.preventDefault()

      try {
        const hasSelection = !!window.getSelection()?.toString()
        const activeElement = document.activeElement
        const canPaste = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement

        // Create menu dynamically based on current state
        const menu = await Menu.new({
          items: [
            await MenuItem.new({
              id: 'copy',
              text: 'Copy',
              enabled: hasSelection,
              action: async () => {
                try {
                  const selectedText = window.getSelection()?.toString()
                  if (selectedText) {
                    await writeText(selectedText)
                  }
                } catch (error) {
                  console.error('Copy failed:', error)
                }
              },
            }),
            await MenuItem.new({
              id: 'paste',
              text: 'Paste',
              enabled: canPaste,
              action: async () => {
                try {
                  const text = await readText()
                  if (text) {
                    // Insert text at cursor pos of input/textarea
                    const activeElement = document.activeElement
                    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
                      const start = activeElement.selectionStart || 0
                      const end = activeElement.selectionEnd || 0
                      const currentValue = activeElement.value
                      const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)

                      // Ensure setter works properly for React controlled inputs
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype,
                        'value',
                      )?.set

                      if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(activeElement, newValue)
                      }

                      // Set cursor pos
                      activeElement.selectionStart = activeElement.selectionEnd = start + text.length

                      // Trigger both input chaneg events
                      const inputEvent = new Event('input', { bubbles: true })
                      const changeEvent = new Event('change', { bubbles: true })
                      activeElement.dispatchEvent(inputEvent)
                      activeElement.dispatchEvent(changeEvent)
                    }
                  }
                } catch (error) {
                  console.error('Paste failed:', error)
                }
              },
            }),
          ],
        })

        await menu.popup()
      } catch (error) {
        console.error('Error showing context menu:', error)
      }
    }

    document.addEventListener('contextmenu', handleGlobalContextMenu)

    return () => {
      document.removeEventListener('contextmenu', handleGlobalContextMenu)
    }
  }, [])

  useEffect(() => {
    const applyThemeForUser = async (): Promise<void> => {
      try {
        if (!userSummary) return

        const html = document.documentElement
        // Themes
        let userTheme = 'dark'

        // Get user settings if available
        const cachedUserSettings = await invoke<InvokeSettings>('get_user_settings', {
          steamId: userSummary.steamId,
        })
        userTheme = cachedUserSettings.settings.general.theme || 'dark'

        // Always reset classes and apply the correct one
        html.className = ''
        html.classList.add(userTheme)
        localStorage.setItem('theme', userTheme)
        setTheme(userTheme)
      } catch (error) {
        showDangerToast(t('common.error'))
        console.error('Error in (applyThemeForUser):', error)
        logEvent(`[Error] in (applyThemeForUser): ${error}`)
      }
    }

    applyThemeForUser()
  }, [userSummary, setTheme, t])

  // Disable context menu and refresh actions
  useEffect(() => {
    const disableContextMenuAndRefresh = async (): Promise<void> => {
      const isDev = await invoke<boolean>('is_dev')
      if (!isDev) {
        document.addEventListener('contextmenu', event => event.preventDefault())

        document.addEventListener('keydown', function (event) {
          if (event.key === 'F5') {
            event.preventDefault()
          }

          if (event.ctrlKey && (event.key === 'r' || event.key === 'R')) {
            event.preventDefault()
          }

          if (event.ctrlKey && event.shiftKey && (event.key === 'R' || event.key === 'r')) {
            event.preventDefault()
          }

          if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'F5') {
            this.location.reload()
          }
        })
      }
    }
    disableContextMenuAndRefresh()
  }, [])

  useEffect(() => {
    setUseBeta(userSettings.general.useBeta)
  }, [userSettings.general.useBeta, setUseBeta])

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
    // Check for updates - immediate update for major, or show notification
    const checkForUpdates = async (): Promise<void> => {
      try {
        const isPortable = await isPortableCheck()
        if (isPortable) return

        const update = await check()
        if (update) {
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
    const intervalId = setInterval(checkForUpdates, 5 * 60 * 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [setUpdateAvailable, t])

  // Listen for Steam status changes
  useEffect(() => {
    const unlistenPromise = listen<boolean>('steam_status_changed', event => {
      const isSteamRunning = event.payload
      if (!isSteamRunning && userSummary) {
        invoke('kill_all_steamutil_processes')
        setIsCardFarming(false)
        setIsAchievementUnlocker(false)
        setShowSteamWarning(true)
      }
    })

    return () => {
      unlistenPromise.then(unlisten => unlisten())
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

  // Listen for running processes changes
  useEffect(() => {
    const unlistenPromise = listen('running_processes_changed', event => {
      const response = event.payload as InvokeRunningProcess
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
    })

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [setIdleGamesList])

  const freeGamesCheck = useCallback(() => {
    checkForFreeGames(setFreeGamesList, gamesList)
  }, [setFreeGamesList, gamesList])

  // Check for free games
  useEffect(() => {
    freeGamesCheck()

    const intervalId = setInterval(freeGamesCheck, 60 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [userSummary?.steamId, freeGamesCheck])

  // Auto redeem free games
  useEffect(() => {
    if (userSettings.general.autoRedeemFreeGames && freeGamesList.length > 0) {
      // Create a unique key for the current free games list
      const ids = freeGamesList
        .map(g => g.appid)
        .sort()
        .join(',')
      if (lastRedeemedIdsRef.current === ids) return // Already redeemed this set

      lastRedeemedIdsRef.current = ids
      autoRedeemFreeGames(freeGamesList, setFreeGamesList, userSummary, gamesContext)
    }
  }, [userSettings.general.autoRedeemFreeGames, freeGamesList, setFreeGamesList, userSummary, gamesContext])

  useEffect(() => {
    // Set user summary data
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    if (userSummary?.steamId) {
      setUserSummary(userSummary)
    }

    setTimeout(() => {
      setLoadingUserSummary(false)
    }, 500)

    // Start idling games in auto idle list
    startAutoIdleGames()
  }, [setUserSummary, setLoadingUserSummary])

  useEffect(() => {
    const closeWebview = async (): Promise<void> => {
      try {
        const webview = await WebviewWindow.getByLabel('webview')
        setTimeout(async () => {
          await webview?.close()
        }, 5000)
      } catch (error) {
        console.error('Error in (closeWebview):', error)
      }
    }
    closeWebview()
  }, [])
}

// Check for free games
export const checkForFreeGames = async (
  setFreeGamesList: Dispatch<SetStateAction<Game[]>>,
  gamesList: Game[],
): Promise<void> => {
  try {
    // Wait for user summary and games list to be available
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (!userSummary?.steamId || gamesList.length === 0) return

    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })
    const settings = response.settings

    const freeGameNotifications = settings.general.freeGameNotifications
    const freeGamesList = await getFreeGames()

    if (!freeGamesList) return

    // Filter out games the user already owns
    const ownedAppIds = new Set(gamesList.map(game => Number(game.appid)))
    const filteredFreeGames = freeGamesList.games.filter(game => !ownedAppIds.has(Number(game.appid)))

    // Compare the new free games with the old ones
    const oldFreeGamesIdsStr = localStorage.getItem('freeGamesIds')
    const oldFreeGameIds: number[] = oldFreeGamesIdsStr ? JSON.parse(oldFreeGamesIdsStr) : []
    const newFreeGameIds: number[] = filteredFreeGames.map(game => Number(game.appid))

    // Show free games tab if there are any
    if (filteredFreeGames.length > 0) {
      setFreeGamesList(filteredFreeGames)

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
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (checkForFreeGames):', error)
    logEvent(`[Error] in (checkForFreeGames): ${error}`)
  }
}

// Auto redeem free games
export const autoRedeemFreeGames = async (
  freeGamesList: Game[],
  setFreeGamesList: Dispatch<SetStateAction<Game[]>>,
  userSummary: UserSummary,
  gamesContext: GamesListHook,
): Promise<void> => {
  try {
    const redeemedAppIds: number[] = []

    for (const game of freeGamesList) {
      const result = await invoke<InvokeRedeemFreeGame>('redeem_free_game', { appId: game.appid })
      if (result.success) {
        showSuccessToast(t('toast.autoRedeem.success', { appName: game.name }))
        logEvent(`[Auto Redeem] Successfully redeemed free game ${game.name} (${game.appid})`)
        redeemedAppIds.push(Number(game.appid))
      } else {
        showDangerToast(t('toast.autoRedeem.failure', { appName: game.name }))
        logEvent(`[Auto Redeem] Failed to redeem free game ${game.name} (${game.appid}) - ${result.message}`)
      }
    }

    if (redeemedAppIds.length > 0) {
      // Update free games list and localStorage
      setFreeGamesList(prev => prev.filter(game => !redeemedAppIds.includes(Number(game.appid))))
      const oldIdsStr = localStorage.getItem('freeGamesIds')
      const oldIds: number[] = oldIdsStr ? JSON.parse(oldIdsStr) : []
      const newIds = oldIds.filter(id => !redeemedAppIds.includes(id))
      localStorage.setItem('freeGamesIds', JSON.stringify(newIds))

      setTimeout(() => {
        handleRefetch(t, userSummary?.steamId, gamesContext.setRefreshKey, false)
      }, 3000)
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (autoRedeemFreeGames):', error)
    logEvent(`[Error] in (autoRedeemFreeGames): ${error}`)
  }
}

// Start idling games in auto idle list
export const startAutoIdleGames = async (): Promise<void> => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (!userSummary?.steamId) return

    // Check if Steam is running, if not, wait until it is
    // Recheck every 10 seconds, timeout after 5 minutes
    // We do this because it can take some time for Steam to launch on system startup
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

      setTimeout(
        () => {
          if (checkInterval) {
            clearInterval(checkInterval)
          }
        },
        5 * 60 * 1000,
      )

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

export async function startAutoIdleGamesImpl(steamId: string, manual?: boolean): Promise<void> {
  try {
    const customLists = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId,
      list: 'autoIdleList',
    })

    if (manual && customLists.list_data.length === 0) {
      showNoGamesToast()
      return
    }

    if (!customLists.error && customLists.list_data.length > 0) {
      // Only idle a maximum of 32 games
      const autoIdleGames = customLists.list_data.slice(0, 32)
      const gameIds = autoIdleGames.map(game => game.appid)

      // Get currently running games to avoid starting duplicates
      const response = await invoke<InvokeRunningProcess>('get_running_processes')
      const processes = response?.processes
      const runningIdlers = processes.map(p => p.appid)

      // Start idling games that are not already idling
      const gamesToIdle = gameIds.filter(id => !runningIdlers.includes(id))

      if (gamesToIdle.length === 0) return

      // Attempt to start games with retry logic
      let retryCount = 0
      const maxRetries = 3
      let remainingGames = [...gamesToIdle]

      while (remainingGames.length > 0 && retryCount < maxRetries) {
        // Start the remaining games concurrently
        await Promise.all(
          remainingGames.map(async appid => {
            const game = autoIdleGames.find(g => g.appid === appid)
            if (game) {
              await startIdle(game.appid, game.name, true)
            }
          }),
        )

        // Wait a moment for games to start
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Check which games actually started
        const updatedResponse = await invoke<InvokeRunningProcess>('get_running_processes')
        const updatedProcesses = updatedResponse?.processes || []
        const currentlyRunning = updatedProcesses.map(p => p.appid)

        // Filter out games that successfully started
        remainingGames = remainingGames.filter(appid => !currentlyRunning.includes(appid))

        if (remainingGames.length > 0) {
          retryCount++
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 5000))
          }
        }
      }

      if (remainingGames.length > 0) {
        logEvent(`Failed to start auto-idle games after ${maxRetries} attempts: ${remainingGames.join(', ')}`)
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
