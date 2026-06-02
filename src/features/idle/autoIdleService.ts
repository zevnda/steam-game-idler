import type { InvokeCustomList, InvokeRunningProcess, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { startIdle } from './coreIdleService'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import {
  AUTO_IDLE_CHECK_INTERVAL_MS,
  AUTO_IDLE_RETRY_DELAY_MS,
  AUTO_IDLE_RETRY_MAX,
  AUTO_IDLE_STEAM_WAIT_READY_DELAY_MS,
  AUTO_IDLE_STEAM_WAIT_TIMEOUT_MS,
  MAX_IDLE_PROCESSES,
} from '@/shared/utils/constants'
import { checkSteamStatus } from '@/shared/utils/system'

export async function startAutoIdleGames() {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (!userSummary?.steamId) return

    const isSteamRunning = await checkSteamStatus(false)
    if (!isSteamRunning) {
      const checkInterval = setInterval(async () => {
        const running = await checkSteamStatus(false)
        if (running) {
          clearInterval(checkInterval)
          setTimeout(
            () => startAutoIdleGamesImpl(userSummary.steamId),
            AUTO_IDLE_STEAM_WAIT_READY_DELAY_MS,
          )
        }
      }, AUTO_IDLE_CHECK_INTERVAL_MS)
      setTimeout(() => clearInterval(checkInterval), AUTO_IDLE_STEAM_WAIT_TIMEOUT_MS)
      return
    }

    await startAutoIdleGamesImpl(userSummary.steamId)
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in startAutoIdleGames:', error)
    await logEvent(`[Error] in (startAutoIdleGames): ${error}`)
  }
}

export async function startAutoIdleGamesImpl(steamId: string, manual?: boolean) {
  try {
    const customLists = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId,
      list: 'autoIdleList',
    })

    if (manual && customLists.list_data.length === 0) {
      toast.noGames()
      return
    }

    if (!customLists.error && customLists.list_data.length > 0) {
      const disabled = JSON.parse(
        localStorage.getItem(`autoIdleDisabled_${steamId}`) || '[]',
      ) as number[]
      const disabledSet = new Set<number>(disabled)
      const autoIdleGames = customLists.list_data
        .filter(g => !disabledSet.has(g.appid))
        .slice(0, MAX_IDLE_PROCESSES)
      const gameIds = autoIdleGames.map(g => g.appid)

      const runningRes = await invoke<InvokeRunningProcess>('get_running_processes')
      const runningIds = runningRes?.processes.map(p => p.appid) ?? []
      let remaining = gameIds.filter(id => !runningIds.includes(id))
      if (remaining.length === 0) return

      let retryCount = 0
      while (remaining.length > 0 && retryCount < AUTO_IDLE_RETRY_MAX) {
        await Promise.all(
          remaining.map(async appid => {
            const game = autoIdleGames.find(g => g.appid === appid)
            if (game) await startIdle(game.appid, game.name, true)
          }),
        )
        await new Promise(resolve => setTimeout(resolve, 2000))

        const updatedRes = await invoke<InvokeRunningProcess>('get_running_processes')
        const currentlyRunning = updatedRes?.processes.map(p => p.appid) ?? []
        remaining = remaining.filter(id => !currentlyRunning.includes(id))

        if (remaining.length > 0 && ++retryCount < AUTO_IDLE_RETRY_MAX) {
          await new Promise(resolve => setTimeout(resolve, AUTO_IDLE_RETRY_DELAY_MS))
        }
      }

      if (remaining.length > 0) {
        await logEvent(
          `Failed to start auto-idle games after ${AUTO_IDLE_RETRY_MAX} attempts: ${remaining.join(', ')}`,
        )
      }
    }
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in startAutoIdleGamesImpl:', error)
    await logEvent(`[Error] in (startAutoIdleGamesImpl): ${error}`)
  }
}
