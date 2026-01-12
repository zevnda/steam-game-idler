import crypto from 'crypto'
import type {
  InvokeSettings,
  InvokeSteamCredentials,
  InvokeValidateSession,
  LatestData,
  UserSettings,
  UserSummary,
} from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { TrayIcon } from '@tauri-apps/api/tray'
import { open } from '@tauri-apps/plugin-shell'

import { fetchUserSummary } from '@/hooks/settings/useCardSettings'
import {
  showAccountMismatchToast,
  showDangerToast,
  showIncorrectCredentialsToast,
  showSteamNotRunningToast,
  t,
} from '@/utils/toasts'

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
    const res = await fetch('https://raw.githubusercontent.com/Autapomorph/steam-game-idler/main/latest.json')
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

// Automatically revalidate Steam credentials for PRO users
export async function autoRevalidateSteamCredentials(
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<{ credentials: { sid: string; sls: string } | null } | void> {
  try {
    const result = await invoke<InvokeSteamCredentials>('open_steam_login_window')

    if (!result || result.success === false) {
      showDangerToast(t('common.error'))
      logEvent(`[Error] in (handleShowSteamLoginWindow): ${result?.message || 'Unknown error'}`)
      return
    }

    if (result.success === true && result.sessionid.length > 0 && result.steamLoginSecure.length > 0) {
      const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

      const cachedUserSettings = await invoke<InvokeSettings>('get_user_settings', {
        steamId: userSummary?.steamId,
      })

      // Verify steam cookies are valid
      const validate = await invoke<InvokeValidateSession>('validate_session', {
        sid: result.sessionid,
        sls: result.steamLoginSecure,
        sma: result.steamMachineAuth || result.steamParental || undefined,
        steamid: userSummary?.steamId,
      })

      if (validate.user) {
        const steamId = result.steamLoginSecure.slice(0, 17)
        const apiKey = cachedUserSettings.settings.general.apiKey

        // Wait for user info first, which should be faster
        const cardFarmingUser = await fetchUserSummary(steamId, apiKey)

        // Make sure user isn't trying to farm cards with different account than they're logged in with
        if (cardFarmingUser.steamId !== userSummary?.steamId) {
          showAccountMismatchToast('danger')
          return logEvent('[Error] in (handleSave) Account mismatch between Steam and SGI')
        }

        // Save valid cookies and update UI state
        await invoke<InvokeSettings>('update_user_settings', {
          steamId: userSummary?.steamId,
          key: 'cardFarming.credentials',
          value: {
            sid: encrypt(result.sessionid),
            sls: encrypt(result.steamLoginSecure),
            sma: null,
          },
        })

        // Save card farming user and update UI state
        const updatedUserSettings = await invoke<InvokeSettings>('update_user_settings', {
          steamId: userSummary?.steamId,
          key: 'cardFarming.userSummary',
          value: cardFarmingUser,
        })

        setUserSettings(updatedUserSettings.settings)

        logEvent(`[Auto Revalidate] Steam credentials were automatically revalidated for ${validate.user}`)

        return {
          credentials: updatedUserSettings.settings.cardFarming.credentials,
        }
      } else {
        showIncorrectCredentialsToast()
        logEvent('[Error] [Settings - Card Farming] Incorrect card farming credentials')
      }
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (autoRevalidateSteamCredentials):', error)
    logEvent(`[Error] in (autoRevalidateSteamCredentials): ${error}`)
  }
}

// Clear local/session storage but preserving important keys
export const preserveKeysAndClearData = async (): Promise<void> => {
  try {
    const keysToPreserve = ['theme', 'minToTrayNotified', 'seenNotifications', 'hasUpdated', 'isFirstTimeUser']

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

export async function updateTrayIcon(tooltip?: string, runningStatus?: boolean): Promise<void> {
  try {
    const trayIcon = await TrayIcon.getById('1')
    if (trayIcon) {
      if (tooltip) {
        await trayIcon.setTooltip(tooltip)
      } else {
        await trayIcon.setTooltip('Steam Game Idler')
      }

      if (runningStatus) {
        // Get icon as base64 from backend
        const base64Icon = await invoke<string>('get_tray_icon', { default: false })
        const iconBuffer = Uint8Array.from(atob(base64Icon), c => c.charCodeAt(0))
        await trayIcon.setIcon(iconBuffer)
      } else {
        const base64Icon = await invoke<string>('get_tray_icon', { default: true })
        const iconBuffer = Uint8Array.from(atob(base64Icon), c => c.charCodeAt(0))
        await trayIcon.setIcon(iconBuffer)
      }
    }
  } catch (error) {
    console.error('Error in updateTrayIcon:', error)
    logEvent(`[Error] in updateTrayIcon: ${error}`)
  }
}

export async function isPortableCheck(): Promise<boolean> {
  try {
    const portable = await invoke<boolean>('is_portable')
    return portable
  } catch (error) {
    console.error('Error in isPortable:', error)
    logEvent(`[Error] in isPortable: ${error}`)
    return false
  }
}

export const handleOpenExtLink = async (href: string): Promise<void> => {
  try {
    await open(href)
  } catch (error) {
    console.error('Failed to open link:', error)
  }
}
