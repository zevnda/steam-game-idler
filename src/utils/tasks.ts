import crypto from 'crypto'
import type { InvokeSettings, LatestData, UserSummary } from '@/types'

import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'

import { showDangerToast, showSteamNotRunningToast, t } from '@/utils/toasts'

export async function checkSteamStatus(showToast: boolean = false): Promise<boolean> {
  try {
    const isSteamRunning = await invoke<boolean>('is_steam_running')
    if (!isSteamRunning && showToast) showSteamNotRunningToast()
    return isSteamRunning
  } catch (error) {
    console.error('Error in (isSteamRunning):', error)
    logEvent(`[Error] in (isSteamRunning): ${error}`)
    return false
  }
}

// Fetch the latest.json for tauri updater
export async function fetchLatest(): Promise<LatestData | null> {
  try {
    const res = await fetch('https://raw.githubusercontent.com/zevnda/steam-game-idler/main/latest.json')
    const data = await res.json()
    return data
  } catch (error) {
    console.error('Error in (fetchLatest):', error)
    logEvent(`[Error] in (fetchLatest): ${error}`)
    return null
  }
}

// Manage the anti-away status
let antiAwayInterval: ReturnType<typeof setTimeout> | null = null
export async function antiAwayStatus(active: boolean | null = null): Promise<void> {
  try {
    const steamRunning = await invoke('is_steam_running')
    if (!steamRunning) return

    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })

    const settings = response.settings

    const { antiAway } = settings?.general || {}

    const shouldRun = active !== null ? active : antiAway

    if (shouldRun) {
      await invoke('anti_away')
      if (!antiAwayInterval) {
        antiAwayInterval = setInterval(
          async () => {
            await invoke('anti_away')
          },
          3 * 60 * 1000,
        )
      }
    } else {
      if (antiAwayInterval) {
        clearInterval(antiAwayInterval)
        antiAwayInterval = null
      }
    }
  } catch (error) {
    console.error('Error in (antiAwayStatus):', error)
    logEvent(`[Error] in (antiAwayStatus): ${error}`)
  }
}

// Clear local/session storage but preserving important keys
export const preserveKeysAndClearData = async (): Promise<void> => {
  try {
    const keysToPreserve = ['theme', 'minToTrayNotified', 'seenNotifications', 'hasUpdated']

    const preservedData: Record<string, string> = keysToPreserve.reduce(
      (acc, key) => {
        const value = localStorage.getItem(key)
        if (value) acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )

    localStorage.clear()
    sessionStorage.clear()

    await invoke('delete_all_cache_files')

    Object.entries(preservedData).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (preserveKeysAndClearData):', error)
    logEvent(`[Error] in (preserveKeysAndClearData): ${error}`)
  }
}

// Get the app version
export const getAppVersion = async (): Promise<string | undefined> => {
  try {
    const appVersion = await getVersion()
    return appVersion
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (getAppVersion):', error)
    logEvent(`[Error] in (getAppVersion): ${error}`)
  }
}

// Log event
export async function logEvent(message: string): Promise<void> {
  try {
    const version = await getVersion()
    await invoke('log_event', { message: `[v${version}] ${message}` })
  } catch (error) {
    console.error('Error in logEvent util: ', error)
  }
}

export function encrypt(string: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', '7k9m2n8q4r6t1u3w5y7z9a2c4e6g8h0j', iv)
    let encrypted = cipher.update(string, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Error in encrypt function:', error)
    return ''
  }
}

export function decrypt(string: string): string {
  try {
    const parts = string.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    const decipher = crypto.createDecipheriv('aes-256-gcm', '7k9m2n8q4r6t1u3w5y7z9a2c4e6g8h0j', iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Error in decrypt function:', error)
    return ''
  }
}
