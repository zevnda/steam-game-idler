import type { InvokeSettings, InvokeValidateKey, UserSettings, UserSummary } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import { useTranslation } from 'react-i18next'

import { encrypt, logEvent } from '@/utils/tasks'
import { showDangerToast, showSuccessToast, t } from '@/utils/toasts'

interface GeneralSettingsHook {
  startupState: boolean | null
  setStartupState: Dispatch<SetStateAction<boolean | null>>
  keyValue: string
  setKeyValue: Dispatch<SetStateAction<string>>
  hasKey: boolean
  setHasKey: Dispatch<SetStateAction<boolean>>
  sliderLabel: string
  setSliderLabel: Dispatch<SetStateAction<string>>
}

export const useGeneralSettings = (): GeneralSettingsHook => {
  const { t } = useTranslation()
  const { userSettings } = useUserStore()
  const [startupState, setStartupState] = useState<boolean | null>(null)
  const [keyValue, setKeyValue] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [sliderLabel, setSliderLabel] = useState('')

  // Sync local settings with global settings when they change
  useEffect(() => {
    const value = userSettings.general?.chatSounds
    const getPercent = (val: number): number => Math.round((val / 3) * 100)
    setSliderLabel(
      t('settings.general.chatSounds.description', {
        value: `${getPercent(value[0])}%`,
      }),
    )
  }, [userSettings.general?.chatSounds, setSliderLabel, t])

  useEffect(() => {
    // Check the current state of auto start
    const checkStartupState = async (): Promise<void> => {
      const isEnabledState = await isEnabled()
      setStartupState(isEnabledState)
    }
    checkStartupState()
  }, [])

  useEffect(() => {
    // Load Steam web API key from localStorage
    const apiKey = userSettings.general.apiKey
    if (apiKey && apiKey.length > 0) {
      setHasKey(true)
      setKeyValue(apiKey)
    }
  }, [userSettings.general.apiKey])

  return {
    startupState,
    setStartupState,
    keyValue,
    setKeyValue,
    hasKey,
    setHasKey,
    sliderLabel,
    setSliderLabel,
  }
}

// Toggle app auto start using tauri plugin
export const handleRunAtStartupChange = async (
  setStartupState: Dispatch<SetStateAction<boolean | null>>,
): Promise<void> => {
  try {
    const isEnabledState = await isEnabled()
    if (isEnabledState) {
      await disable()
    } else {
      await enable()
    }
    setStartupState(!isEnabledState)
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleRunAtStartupChange):', error)
    logEvent(`[Error] in (handleRunAtStartupChange): ${error}`)
  }
}

// Saves Steam web API key to localStorage
export const handleKeySave = async (
  steamId: string | undefined,
  keyValue: string,
  setHasKey: Dispatch<SetStateAction<boolean>>,
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
  try {
    if (keyValue.length > 0) {
      const validate = await invoke<InvokeValidateKey>('validate_steam_api_key', {
        steamId,
        apiKey: keyValue,
      })

      if (validate.response) {
        const response = await invoke<InvokeSettings>('update_user_settings', {
          steamId,
          key: 'general.apiKey',
          value: encrypt(keyValue),
        })
        setUserSettings(response.settings)

        setHasKey(true)

        showSuccessToast(t('toast.apiKey.save'))
        logEvent('[Settings - General] Steam web API key added')
      } else {
        showDangerToast(t('toast.apiKey.error'))
      }
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleKeySave):', error)
    logEvent(`[Error] in (handleKeySave): ${error}`)
  }
}

// Removes Steam API key from localStorage and resets state
export const handleClear = async (
  steamId: string | undefined,
  setKeyValue: Dispatch<SetStateAction<string>>,
  setHasKey: Dispatch<SetStateAction<boolean>>,
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
  try {
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId,
      key: 'general.apiKey',
      value: null,
    })
    setUserSettings(response.settings)
    setKeyValue('')
    setHasKey(false)
    showSuccessToast(t('toast.apiKey.clear'))
    logEvent('[Settings - General] Steam web API key cleared')
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleClear):', error)
    logEvent(`[Error] in (handleClear): ${error}`)
  }
}

// Handle changes to the slider in the settings
export const handleSliderChange = async (
  newInterval: [number, number] | number[] | number,
  userSummary: UserSummary,
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
  try {
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'general.chatSounds',
      value: newInterval,
    })
    setUserSettings(response.settings)
    logEvent(`[Settings - General] Changed 'chatSounds' to '${String(newInterval)}'`)
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleSliderChange - General):', error)
    logEvent(`[Error] in (handleSliderChange - General): ${error}`)
  }
}
