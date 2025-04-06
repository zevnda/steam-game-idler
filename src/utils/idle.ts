import type { InvokeIdle, InvokeRunningProcess, InvokeSettings, UserSummary } from '@/types'

import { invoke } from '@tauri-apps/api/core'

import { checkSteamStatus, logEvent } from '@/utils/tasks'
import { showAccountMismatchToast, showWarningToast, t } from '@/utils/toasts'

const idleTimeouts: { [key: number]: ReturnType<typeof setTimeout> } = {}
const idleIntervals: { [key: number]: ReturnType<typeof setTimeout> } = {}

// Start idling a game
export async function startIdle(appId: number, appName: string, manual: boolean = true): Promise<boolean> {
  try {
    // Make sure Steam client is running
    const isSteamRunning = checkSteamStatus(true)
    if (!isSteamRunning) return false

    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    const settingsResponse = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })

    const gameSettings = settingsResponse.settings.gameSettings || {}
    const maxIdleTime = gameSettings[appId]?.maxIdleTime || 0

    // Make sure the game is not already being idled
    const response = await invoke<InvokeRunningProcess>('get_running_processes')
    const processes = response?.processes
    const runningIdlers = processes.map(p => p.appid)

    if (runningIdlers.includes(appId)) {
      showWarningToast(t('toast.startIdle.alreadyIdling', { appName, appId }))
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
export async function stopIdle(appId: number | undefined, appName: string | undefined): Promise<boolean> {
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
export async function startFarmIdle(appIds: number[]): Promise<boolean> {
  try {
    // Make sure Steam client is running
    const isSteamRunning = checkSteamStatus(true)
    if (!isSteamRunning) return false

    const response = await invoke<InvokeIdle>('start_farm_idle', { appIds })
    if (response.success) {
      logEvent(`[Card Farming] Started idling ${appIds.length} games`)
      return true
    } else {
      showAccountMismatchToast('danger')
      console.error('Error starting farm idle: ', response.error)
      logEvent('[Error] [Card Farming] Failed to idle one or more games - possible account mismatch')
      return false
    }
  } catch (error) {
    console.error('Error in startFarmIdle util: ', error)
    logEvent(`[Error] in (startFarmIdle) util: ${error}`)
    return false
  }
}

// Stop farming idle
export async function stopFarmIdle(appIds: number[]): Promise<boolean> {
  try {
    await invoke('stop_farm_idle')
    logEvent(`[Card Farming] Stopped idling ${appIds.length} games`)
    return true
  } catch (error) {
    console.error('Error in stopFarmIdle util (these errors can often be ignored): ', error)
    return false
  }
}
