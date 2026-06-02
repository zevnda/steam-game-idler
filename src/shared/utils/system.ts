import type {
  InvokeSettings,
  InvokeSteamCredentials,
  InvokeValidateSession,
  UserSettings,
  UserSummary,
} from '@/shared/types'
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { TrayIcon } from '@tauri-apps/api/tray'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { openUrl } from '@tauri-apps/plugin-opener'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores/userStore'

export async function checkSteamStatus(showToast: boolean) {
  try {
    const isSteamRunning = await invoke<boolean>('is_steam_running')
    if (!isSteamRunning && showToast) toast.steamNotRunning()
    return isSteamRunning
  } catch (error) {
    console.error('Error in checkSteamStatus:', error)
    await logEvent(`[Error] in (isSteamRunning): ${error}`)
    return false
  }
}

export async function fetchLatest() {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/zevnda/steam-game-idler/main/latest.json',
    )
    return await res.json()
  } catch (error) {
    console.error('Error in fetchLatest:', error)
    await logEvent(`[Error] in (fetchLatest): ${error}`)
    return null
  }
}

let antiAwayInterval: ReturnType<typeof setInterval> | null = null

export async function antiAwayStatus(active: boolean | null = null) {
  try {
    const steamRunning = await invoke('is_steam_running')
    if (!steamRunning) return

    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })
    const { antiAway } = response.settings?.general || {}
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
    console.error('Error in antiAwayStatus:', error)
    await logEvent(`[Error] in (antiAwayStatus): ${error}`)
  }
}

export async function updateTrayIcon(tooltip?: string, runningStatus?: boolean) {
  try {
    const trayIcon = await TrayIcon.getById('1')
    if (!trayIcon) return

    await trayIcon.setTooltip(tooltip ?? 'Steam Game Idler')

    const base64Icon = await invoke<string>('get_tray_icon', { default: !runningStatus })
    const iconBuffer = Uint8Array.from(atob(base64Icon), c => c.charCodeAt(0))
    await trayIcon.setIcon(iconBuffer)
  } catch (error) {
    console.error('Error in updateTrayIcon:', error)
    await logEvent(`[Error] in updateTrayIcon: ${error}`)
  }
}

export async function updateDiscordPresence(details?: string, state?: string) {
  try {
    const discordPresence = useUserStore.getState().userSettings.general.discordPresence
    if (!discordPresence) return
    if (state) {
      await invoke('update_drp', { details, state })
    } else {
      await invoke('update_drp')
    }
  } catch (error) {
    console.error('Error in updateDiscordPresence:', error)
    await logEvent(`[Error] in updateDiscordPresence: ${error}`)
  }
}

export async function isPortableCheck() {
  try {
    return await invoke<boolean>('is_portable')
  } catch (error) {
    console.error('Error in isPortable:', error)
    await logEvent(`[Error] in isPortable: ${error}`)
    return false
  }
}

export async function sendNativeNotification(title: string, body: string) {
  try {
    let permissionGranted = await isPermissionGranted()
    if (!permissionGranted) {
      const permission = await requestPermission()
      permissionGranted = permission === 'granted'
    }
    if (permissionGranted) sendNotification({ title, body })
  } catch (error) {
    console.error('Error in sendNativeNotification:', error)
    await logEvent(`[Error] in (sendNativeNotification): ${error}`)
  }
}

export async function openExternalLink(href: string) {
  try {
    await openUrl(href)
  } catch (error) {
    console.error('Failed to open link:', error)
  }
}

export async function getAppVersion() {
  try {
    return await getVersion()
  } catch (error) {
    console.error('Error in getAppVersion:', error)
    return ''
  }
}

export async function preserveKeysAndClearData() {
  try {
    const keysToPreserve = [
      'theme',
      'minToTrayNotified',
      'seenNotifications',
      'hasUpdated',
      'isFirstTimeUser',
    ]
    const preserved: Record<string, string> = {}
    for (const key of keysToPreserve) {
      const val = localStorage.getItem(key)
      if (val) preserved[key] = val
    }
    localStorage.clear()
    sessionStorage.clear()
    await invoke('delete_all_cache_files')
    for (const [key, val] of Object.entries(preserved)) {
      localStorage.setItem(key, val)
    }
  } catch (error) {
    console.error('Error in preserveKeysAndClearData:', error)
    await logEvent(`[Error] in (preserveKeysAndClearData): ${error}`)
  }
}

export async function autoRevalidateSteamCredentials(
  setUserSettings: (value: UserSettings) => void,
) {
  try {
    const result = await invoke<InvokeSteamCredentials>('open_steam_login_window')
    if (!result || result.success === false) {
      toast.danger('common.error')
      await logEvent(
        `[Error] in (autoRevalidateSteamCredentials): ${result?.message || 'Unknown error'}`,
      )
      return null
    }

    if (
      result.success === true &&
      result.sessionid.length > 0 &&
      result.steamLoginSecure.length > 0
    ) {
      const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
      const cachedSettings = await invoke<InvokeSettings>('get_user_settings', {
        steamId: userSummary?.steamId,
      })

      const validate = await invoke<InvokeValidateSession>('validate_session', {
        sid: result.sessionid,
        sls: result.steamLoginSecure,
        sma: result.steamMachineAuth || result.steamParental || undefined,
        steamid: userSummary?.steamId,
      })

      if (validate.user) {
        const steamId = result.steamLoginSecure.slice(0, 17)
        const { encrypt } = await import('@/shared/utils/crypto')
        const { fetchUserSummary } = await import('@/features/settings')
        const cardFarmingUser = await fetchUserSummary(
          steamId,
          cachedSettings.settings.general.apiKey,
        )

        if (cardFarmingUser.steamId !== userSummary?.steamId) {
          toast.accountMismatch('danger')
          await logEvent('[Error] in (autoRevalidateSteamCredentials) Account mismatch')
          return null
        }

        await invoke<InvokeSettings>('update_user_settings', {
          steamId: userSummary?.steamId,
          key: 'cardFarming.credentials',
          value: {
            sid: encrypt(result.sessionid),
            sls: encrypt(result.steamLoginSecure),
            sma: null,
          },
        })

        const updatedSettings = await invoke<InvokeSettings>('update_user_settings', {
          steamId: userSummary?.steamId,
          key: 'cardFarming.userSummary',
          value: cardFarmingUser,
        })

        setUserSettings(updatedSettings.settings)
        await logEvent(
          `[Auto Revalidate] Credentials automatically revalidated for ${validate.user}`,
        )

        return { credentials: updatedSettings.settings.cardFarming.credentials }
      } else {
        toast.incorrectCredentials()
        await logEvent('[Error] [Settings] Incorrect card farming credentials')
      }
    }
    return null
  } catch (error) {
    console.error('Error in autoRevalidateSteamCredentials:', error)
    await logEvent(`[Error] in (autoRevalidateSteamCredentials): ${error}`)
    return null
  }
}
