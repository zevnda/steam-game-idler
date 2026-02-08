import type { InvokeSettings, InvokeValidateKey, UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast, showSuccessToast } from '@/shared/components'
import { encrypt, logEvent } from '@/shared/utils'

export const handleSteamWebAPIKeySave = async (
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
        logEvent('[Settings - General] Invalid Steam web API key')
      }
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleSteamWebAPIKeySave):', error)
    logEvent(`[Error] in (handleSteamWebAPIKeySave): ${error}`)
  }
}

export const handleSteamWebAPIKeyClear = async (
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
    console.error('Error in (handleSteamWebAPIKeyClear):', error)
    logEvent(`[Error] in (handleSteamWebAPIKeyClear): ${error}`)
  }
}
