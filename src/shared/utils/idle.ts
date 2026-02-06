import type { GameForFarming } from '@/features/card-farming'
import type {
  Game,
  InvokeIdle,
  InvokeKillProcess,
  InvokeRunningProcess,
  InvokeSettings,
  UserSummary,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import {
  showAccountMismatchToast,
  showDangerToast,
  showSuccessToast,
  showWarningToast,
} from '@/shared/ui'
import { checkSteamStatus, logEvent } from '@/shared/utils'

const idleTimeouts: { [key: number]: ReturnType<typeof setTimeout> } = {}
const idleIntervals: { [key: number]: ReturnType<typeof setTimeout> } = {}

// Start idling a game
export async function startIdle(appId: number, appName: string, manual: boolean) {
  try {
    // Make sure Steam client is running
    const isSteamRunning = checkSteamStatus(true)
    if (!isSteamRunning) return false

    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    const settingsResponse = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })

    const gameSettings = settingsResponse.settings.gameSettings || {}
    let maxIdleTime = 0
    // Check for globalMaxIdleTime first
    const globalMaxIdleTime =
      typeof gameSettings.globalMaxIdleTime === 'number' ? gameSettings.globalMaxIdleTime : 0
    if (globalMaxIdleTime > 0) {
      maxIdleTime = globalMaxIdleTime
    } else {
      const perGameSetting = gameSettings[appId]
      if (
        typeof perGameSetting === 'object' &&
        perGameSetting !== null &&
        !Array.isArray(perGameSetting)
      ) {
        maxIdleTime = perGameSetting.maxIdleTime || 0
      }
    }

    // Make sure the game is not already being idled
    const response = await invoke<InvokeRunningProcess>('get_running_processes')
    const processes = response?.processes
    const runningIdlers = processes.map(p => p.appid)

    if (processes.length === 32) {
      // We already show a warning toast if startIdle returns false in most cases, so just log here
      logEvent(
        `[Error] [Idle] Maximum number of idling processes (32) reached when attempting to idle ${appName} (${appId})`,
      )
      return false
    }

    if (runningIdlers.includes(appId)) {
      // This is unlikely to happen but worth handling just in case
      showWarningToast(i18next.t('toast.startIdle.alreadyIdling', { appName, appId }))
      logEvent(`[Error] [Idle] Attempted to idle already idling game ${appName} (${appId})`)
      return false
    }

    const idleResponse = await invoke<InvokeIdle>('start_idle', {
      appId: Number(appId),
      appName,
    })

    if (idleResponse.success) {
      // If maxIdleTime is set, stop idling after the specified time
      if (manual && maxIdleTime > 0) {
        idleTimeouts[appId] = setTimeout(() => {
          stopIdle(appId, appName)
        }, maxIdleTime * 60000)

        idleIntervals[appId] = setInterval(async () => {
          const response = await invoke<InvokeRunningProcess>('get_running_processes')

          const processes = response?.processes
          const runningIdlers = processes.map(p => p.appid)

          // If the game is no longer being idled, clear the timeout and interval
          if (!runningIdlers.includes(appId)) {
            clearTimeout(idleTimeouts[appId])
            clearInterval(idleIntervals[appId])
            delete idleTimeouts[appId]
            delete idleIntervals[appId]
          }
        }, 5000)
      }
      logEvent(`[Idle] Started idling ${appName} (${appId})`)
      return true
    } else {
      showAccountMismatchToast('danger')
      console.error(`Error starting idler for ${appName} (${appId}): ${idleResponse.error}`)
      logEvent(`[Error] [Idle] Failed to idle ${appName} (${appId}) - account mismatch`)
      return false
    }
  } catch (error) {
    console.error('Error in startIdle util: ', error)
    logEvent(`[Error] in (startIdle) util: ${error}`)
    return false
  }
}

// Stop idling a game
export async function stopIdle(appId: number | undefined, appName: string | undefined) {
  try {
    if (!appId || !appName) {
      return false
    }

    if (idleTimeouts[appId]) {
      clearTimeout(idleTimeouts[appId])
      delete idleTimeouts[appId]
    }
    if (idleIntervals[appId]) {
      clearInterval(idleIntervals[appId])
      delete idleIntervals[appId]
    }
    const response = await invoke<InvokeIdle>('stop_idle', {
      appId: Number(appId),
    })
    if (response.success) {
      logEvent(`[Idle] Stopped idling ${appName} (${appId})`)
      return true
    } else {
      return false
    }
  } catch (error) {
    console.error('Error in stopIdle util (these errors can often be ignored): ', error)
    return false
  }
}

// Start farming idle
export async function startFarmIdle(gamesSet: Set<GameForFarming>) {
  try {
    // Make sure Steam client is running
    const isSteamRunning = checkSteamStatus(true)
    if (!isSteamRunning) return false

    const gamesList = Array.from(gamesSet).map(game => ({
      app_id: Number(game.appid),
      name: game.name,
    }))

    const response = await invoke<InvokeIdle>('start_farm_idle', { gamesList })
    if (response.success) {
      logEvent(`[Card Farming] Started idling ${gamesSet.size} games`)
      return true
    } else {
      showAccountMismatchToast('danger')
      console.error('Error starting farm idle: ', response.error)
      logEvent(
        '[Error] [Card Farming] Failed to idle one or more games - possible account mismatch',
      )
      return false
    }
  } catch (error) {
    console.error('Error in startFarmIdle util: ', error)
    logEvent(`[Error] in (startFarmIdle) util: ${error}`)
    return false
  }
}

// Stop farming idle
export async function stopFarmIdle(gamesSet: Set<GameForFarming>) {
  try {
    await invoke('stop_farm_idle')
    logEvent(`[Card Farming] Stopped idling ${gamesSet.size} games`)
    return true
  } catch (error) {
    console.error('Error in stopFarmIdle util (these errors can often be ignored): ', error)
    return false
  }
}

// Handle starting idling for a game
export const handleIdle = async (item: Game) => {
  try {
    const success = await startIdle(item.appid, item.name, true)
    if (success) {
      showSuccessToast(
        i18next.t('toast.startIdle.success', {
          appName: item.name,
          appId: item.appid,
        }),
      )
    } else {
      showDangerToast(
        i18next.t('toast.startIdle.error', {
          appName: item.name,
          appId: item.appid,
        }),
      )
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in handleIdle:', error)
    logEvent(`Error in (handleIdle): ${error}`)
  }
}

// Handle stopping idling for a game
export const handleStopIdle = async (
  item: Game,
  idleGamesList: Game[],
  setIdleGamesList: (value: Game[]) => void,
) => {
  const game = idleGamesList.find(game => game.appid === item.appid)
  try {
    const response = await invoke<InvokeKillProcess>('kill_process_by_pid', {
      pid: game?.pid,
    })
    if (response.success) {
      setIdleGamesList(idleGamesList.filter(i => i.pid !== item.pid))
      showSuccessToast(
        i18next.t('toast.stopIdle.success', {
          appName: item.name,
          appId: item.appid,
        }),
      )
    } else {
      showDangerToast(
        i18next.t('toast.stopIdle.error', {
          appName: item.name,
          appId: item.appid,
        }),
      )
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in handleStopIdle:', error)
    logEvent(`Error in (handleStopIdle): ${error}`)
  }
}
