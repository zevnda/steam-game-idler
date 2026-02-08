import type { InvokeSettings, UserSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useUserStore } from '@/shared/stores'

export const handleBackgroundSave = async (
  e: React.ChangeEvent<HTMLInputElement>,
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) => {
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

    setUserSettings(prev => ({
      ...prev,
      general: {
        ...prev?.general,
        customBackground: dataUri,
      },
    }))
  }
  reader.readAsDataURL(file)
}

export const handleBackgroundDelete = async (
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) => {
  const { userSummary } = useUserStore.getState()

  await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'general.customBackground',
    value: null,
  })

  setUserSettings(prev => ({
    ...prev,
    general: {
      ...prev?.general,
      customBackground: null,
    },
  }))
}
