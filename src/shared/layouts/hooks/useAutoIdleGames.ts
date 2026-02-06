import type { InvokeCustomList, InvokeRunningProcess, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import i18next from 'i18next'
import {
  checkSteamStatus,
  logEvent,
  showDangerToast,
  showNoGamesToast,
  startIdle,
} from '@/shared/utils'

export function useAutoIdleGames() {
  useEffect(() => {
    // Start idling games in auto idle list
    startAutoIdleGames()
  }, [])
}

// Start idling games in auto idle list
export const startAutoIdleGames = async () => {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (!userSummary?.steamId) return

    // Check if Steam is running, if not, wait until it is
    // Recheck every 10 seconds, timeout after 5 minutes
    // We do this because it can take some time for Steam to launch on system startup
    const isSteamRunning = await checkSteamStatus(false)
    if (!isSteamRunning) {
      const checkInterval = setInterval(async () => {
        const steamRunning = await checkSteamStatus(false)
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
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (startAutoIdleGames):', error)
    logEvent(`[Error] in (startAutoIdleGames): ${error}`)
  }
}

export async function startAutoIdleGamesImpl(steamId: string, manual?: boolean) {
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
        logEvent(
          `Failed to start auto-idle games after ${maxRetries} attempts: ${remainingGames.join(', ')}`,
        )
      }
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (startAutoIdleGamesImpl):', error)
    logEvent(`[Error] in (startAutoIdleGamesImpl): ${error}`)
  }
}
