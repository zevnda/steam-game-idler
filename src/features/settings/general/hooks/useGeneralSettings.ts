import type { InvokeSettings, InvokeValidateKey, UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { useEffect, useState } from 'react'
import i18next from 'i18next'
import { useUserStore } from '@/shared/stores'
import { encrypt, logEvent, showDangerToast, showSuccessToast } from '@/shared/utils'

export const useGeneralSettings = () => {
  const userSettings = useUserStore(state => state.userSettings)
  const [startupState, setStartupState] = useState<boolean | null>(null)
  const [keyValue, setKeyValue] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [sliderLabel, setSliderLabel] = useState('')

  useEffect(() => {
    // Check the current state of auto start
    const checkStartupState = async () => {
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
  setStartupState: React.Dispatch<React.SetStateAction<boolean | null>>,
) => {
  try {
    const isEnabledState = await isEnabled()
    if (isEnabledState) {
      await disable()
    } else {
      await enable()
    }
    setStartupState(!isEnabledState)
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleRunAtStartupChange):', error)
    logEvent(`[Error] in (handleRunAtStartupChange): ${error}`)
  }
}

// Saves Steam web API key to localStorage
export const handleKeySave = async (
  steamId: string | undefined,
  keyValue: string,
  setHasKey: React.Dispatch<React.SetStateAction<boolean>>,
  setUserSettings: (value: UserSettings) => void,
) => {
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

        showSuccessToast(i18next.t('toast.apiKey.save'))
        logEvent('[Settings - General] Steam web API key added')
      } else {
        showDangerToast(i18next.t('toast.apiKey.error'))
      }
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleKeySave):', error)
    logEvent(`[Error] in (handleKeySave): ${error}`)
  }
}

// Removes Steam API key from localStorage and resets state
export const handleClear = async (
  steamId: string | undefined,
  setKeyValue: React.Dispatch<React.SetStateAction<string>>,
  setHasKey: React.Dispatch<React.SetStateAction<boolean>>,
  setUserSettings: (value: UserSettings) => void,
) => {
  try {
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId,
      key: 'general.apiKey',
      value: null,
    })
    setUserSettings(response.settings)
    setKeyValue('')
    setHasKey(false)
    showSuccessToast(i18next.t('toast.apiKey.clear'))
    logEvent('[Settings - General] Steam web API key cleared')
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleClear):', error)
    logEvent(`[Error] in (handleClear): ${error}`)
  }
}
