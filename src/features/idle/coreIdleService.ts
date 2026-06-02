import type { InvokeIdle, InvokeRunningProcess, InvokeSettings, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { MAX_IDLE_PROCESSES } from '@/shared/utils/constants'
import { checkSteamStatus } from '@/shared/utils/system'

const idleTimeouts: Record<number, ReturnType<typeof setTimeout>> = {}
const idleIntervals: Record<number, ReturnType<typeof setInterval>> = {}

export async function startIdle(appId: number, appName: string, manual: boolean) {
  try {
    const isSteamRunning = await checkSteamStatus(true)
    if (!isSteamRunning) return false

    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    const settingsRes = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })
    const gameSettings = settingsRes.settings.gameSettings || {}
    const globalMax =
      typeof gameSettings.globalMaxIdleTime === 'number' ? gameSettings.globalMaxIdleTime : 0

    let maxIdleTime = globalMax
    if (maxIdleTime === 0) {
      const perGame = gameSettings[appId]
      if (typeof perGame === 'object' && perGame !== null && !Array.isArray(perGame)) {
        maxIdleTime = perGame.maxIdleTime || 0
      }
    }

    const runningRes = await invoke<InvokeRunningProcess>('get_running_processes')
    const processes = runningRes?.processes ?? []

    if (processes.length >= MAX_IDLE_PROCESSES) {
      await logEvent(
        `[Error] [Idle] Max processes (${MAX_IDLE_PROCESSES}) reached for ${appName} (${appId})`,
      )
      return false
    }

    if (processes.some(p => p.appid === appId)) {
      toast.warning(i18next.t('toast.startIdle.alreadyIdling', { appName, appId }))
      await logEvent(`[Error] [Idle] Already idling ${appName} (${appId})`)
      return false
    }

    const idleRes = await invoke<InvokeIdle>('start_idle', { appId: Number(appId), appName })
    if (idleRes.success) {
      if (manual && maxIdleTime > 0) {
        idleTimeouts[appId] = setTimeout(() => stopIdle(appId, appName), maxIdleTime * 60000)
        idleIntervals[appId] = setInterval(async () => {
          const res = await invoke<InvokeRunningProcess>('get_running_processes')
          if (!res?.processes.some(p => p.appid === appId)) {
            clearTimeout(idleTimeouts[appId])
            clearInterval(idleIntervals[appId])
            delete idleTimeouts[appId]
            delete idleIntervals[appId]
          }
        }, 5000)
      }
      await logEvent(`[Idle] Started idling ${appName} (${appId})`)
      return true
    } else {
      toast.accountMismatch('danger')
      await logEvent(`[Error] [Idle] Failed to idle ${appName} (${appId}) - account mismatch`)
      return false
    }
  } catch (error) {
    console.error('Error in startIdle:', error)
    await logEvent(`[Error] in (startIdle): ${error}`)
    return false
  }
}

export async function stopIdle(appId: number | undefined, appName: string | undefined) {
  try {
    if (!appId || !appName) return false

    if (idleTimeouts[appId]) {
      clearTimeout(idleTimeouts[appId])
      delete idleTimeouts[appId]
    }
    if (idleIntervals[appId]) {
      clearInterval(idleIntervals[appId])
      delete idleIntervals[appId]
    }

    const res = await invoke<InvokeIdle>('stop_idle', { appId: Number(appId) })
    if (res.success) {
      await logEvent(`[Idle] Stopped idling ${appName} (${appId})`)
      return true
    }
    return false
  } catch (error) {
    console.error('Error in stopIdle (can often be ignored):', error)
    return false
  }
}
