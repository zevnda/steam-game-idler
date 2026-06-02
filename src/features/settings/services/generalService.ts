import type {
  CardFarmingUser,
  InvokeSettings,
  InvokeValidateKey,
  UserSettings,
  UserSummary,
} from '@/shared/types'
import type { TimeInputValue } from '@heroui/react'
import { invoke } from '@tauri-apps/api/core'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores/userStore'
import { decrypt, encrypt } from '@/shared/utils/crypto'

export async function fetchUserSummary(steamId: string, apiKey: string | null) {
  const res = await invoke<{
    response: { players: { steamid: string; personaname: string; avatar: string }[] }
  }>('get_user_summary', {
    steamId,
    apiKey: apiKey ? decrypt(apiKey) : null,
  })
  return {
    steamId: res.response.players[0]?.steamid,
    personaName: res.response.players[0]?.personaname,
    avatar: res.response.players[0]?.avatar.replace('.jpg', '_full.jpg'),
  }
}

interface CheckboxEvent {
  target: { name: string; checked: boolean }
}

export async function handleCheckboxChange(
  e: CheckboxEvent,
  key: keyof UserSettings,
  steamId: string | undefined,
  setUserSettings: (value: UserSettings) => void,
) {
  try {
    const { name, checked } = e.target
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId,
      key: `${key}.${name}`,
      value: checked,
    })

    const exclusives: Record<string, string> = {
      listGames: 'allGames',
      allGames: 'listGames',
      sortByHighestDrops: 'sortByLowestDrops',
      sortByLowestDrops: 'sortByHighestDrops',
      skipNoPlaytime: 'farmUnplayedOnly',
      farmUnplayedOnly: 'skipNoPlaytime',
    }

    const otherName = exclusives[name]
    const isListPair = name === 'listGames' || name === 'allGames'

    if (key === 'cardFarming' && otherName) {
      if (checked) {
        const updated = await invoke<InvokeSettings>('update_user_settings', {
          steamId,
          key: `cardFarming.${otherName}`,
          value: false,
        })
        setUserSettings(updated.settings)
      } else if (isListPair) {
        if (
          !response.settings.cardFarming[otherName as keyof typeof response.settings.cardFarming]
        ) {
          const updated = await invoke<InvokeSettings>('update_user_settings', {
            steamId,
            key: `cardFarming.${otherName}`,
            value: true,
          })
          setUserSettings(updated.settings)
        }
      } else {
        setUserSettings(response.settings)
      }
    } else {
      setUserSettings(response.settings)
    }

    await logEvent(`[Settings - ${key}] Changed '${name}' to '${checked}'`)
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in handleCheckboxChange:', error)
    await logEvent(`[Error] in (handleCheckboxChange): ${error}`)
  }
}

export async function handleRunAtStartupChange() {
  try {
    const enabled = await isEnabled()
    if (enabled) {
      await disable()
    } else {
      await enable()
    }
    return !enabled
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in handleRunAtStartupChange:', error)
    await logEvent(`[Error] in (handleRunAtStartupChange): ${error}`)
    return null
  }
}

export async function handleSteamWebAPIKeySave(
  steamId: string | undefined,
  keyValue: string,
  setHasKey: React.Dispatch<React.SetStateAction<boolean>>,
  setUserSettings: (value: UserSettings) => void,
) {
  try {
    if (!keyValue.length) return
    const validate = await invoke<InvokeValidateKey>('validate_steam_api_key', {
      steamId,
      apiKey: keyValue,
    })
    if (validate.response) {
      const res = await invoke<InvokeSettings>('update_user_settings', {
        steamId,
        key: 'general.apiKey',
        value: encrypt(keyValue),
      })
      setUserSettings(res.settings)
      setHasKey(true)
      toast.success(i18next.t('toast.apiKey.save'))
      await logEvent('[Settings - General] Steam web API key added')
    } else {
      toast.danger(i18next.t('toast.apiKey.error'))
      await logEvent('[Settings - General] Invalid Steam web API key')
    }
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    await logEvent(`[Error] in (handleSteamWebAPIKeySave): ${error}`)
  }
}

export async function handleSteamWebAPIKeyClear(
  steamId: string | undefined,
  setKeyValue: React.Dispatch<React.SetStateAction<string>>,
  setHasKey: React.Dispatch<React.SetStateAction<boolean>>,
  setUserSettings: (value: UserSettings) => void,
) {
  try {
    const res = await invoke<InvokeSettings>('update_user_settings', {
      steamId,
      key: 'general.apiKey',
      value: null,
    })
    setUserSettings(res.settings)
    setKeyValue('')
    setHasKey(false)
    toast.success(i18next.t('toast.apiKey.clear'))
    await logEvent('[Settings - General] Steam web API key cleared')
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    await logEvent(`[Error] in (handleSteamWebAPIKeyClear): ${error}`)
  }
}

export async function handleIntervalChange(
  newInterval: [number, number] | number[] | number,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
) {
  try {
    const res = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'achievementUnlocker.interval',
      value: newInterval,
    })
    setUserSettings(res.settings)
    await logEvent(
      `[Settings - Achievement Unlocker] Changed 'interval' to '${String(newInterval)}'`,
    )
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    await logEvent(`[Error] in (handleIntervalChange): ${error}`)
  }
}

export async function handleScheduleChange(
  value: TimeInputValue | null,
  type: 'scheduleFrom' | 'scheduleTo',
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
) {
  try {
    const res = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: `achievementUnlocker.${type}`,
      value,
    })
    setUserSettings(res.settings)
    await logEvent(`[Settings - Achievement Unlocker] Changed '${type}'`)
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    await logEvent(`[Error] in (handleScheduleChange): ${error}`)
  }
}

export async function handleNextTaskChange(
  feature: 'cardFarming' | 'achievementUnlocker',
  currentKey: string,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
) {
  const res = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: `${feature}.nextTask`,
    value: currentKey,
  })
  setUserSettings(res.settings)
}

export async function handleThemeChange(themeKey: string, setTheme: (v: string) => void) {
  const { userSummary } = useUserStore.getState()
  localStorage.setItem('theme', themeKey)
  setTheme(themeKey)
  await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'general.theme',
    value: themeKey,
  })
}

export async function handleBackgroundSave(
  e: React.ChangeEvent<HTMLInputElement>,
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) {
  const { userSummary } = useUserStore.getState()
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async () => {
    const dataUri = reader.result as string
    await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'general.customBackground',
      value: dataUri,
    })
    setUserSettings(prev => ({ ...prev, general: { ...prev?.general, customBackground: dataUri } }))
  }
  reader.readAsDataURL(file)
}

export async function handleBackgroundDelete(
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) {
  const { userSummary } = useUserStore.getState()
  await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'general.customBackground',
    value: null,
  })
  setUserSettings(prev => ({ ...prev, general: { ...prev?.general, customBackground: null } }))
}

export function getStoredSettings(
  userSettings: UserSettings,
  setHasCookies: React.Dispatch<React.SetStateAction<boolean>>,
  setSidValue: React.Dispatch<React.SetStateAction<string>>,
  setSlsValue: React.Dispatch<React.SetStateAction<string>>,
  setSmaValue: React.Dispatch<React.SetStateAction<string>>,
  setGamesWithDrops: React.Dispatch<React.SetStateAction<number>>,
  setTotalDropsRemaining: React.Dispatch<React.SetStateAction<number>>,
  setCardFarmingUser: React.Dispatch<React.SetStateAction<CardFarmingUser | null>>,
) {
  try {
    const {
      credentials,
      userSummary: cfUser,
      gamesWithDrops,
      totalDropsRemaining,
    } = userSettings.cardFarming
    if (credentials?.sid && credentials?.sls) {
      setHasCookies(true)
      setSidValue(credentials.sid)
      setSlsValue(credentials.sls)
      setSmaValue(credentials?.sma || '')
    }
    if (cfUser?.steamId) setCardFarmingUser(cfUser)
    if (gamesWithDrops > 0 && totalDropsRemaining > 0) {
      setGamesWithDrops(gamesWithDrops)
      setTotalDropsRemaining(totalDropsRemaining)
    }
  } catch (error) {
    console.error('Error in getStoredSettings:', error)
  }
}
