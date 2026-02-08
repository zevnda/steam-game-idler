import type { InvokeSettings, UserSettings, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'

export const handleNextTaskChange = async (
  feature: 'cardFarming' | 'achievementUnlocker',
  currentKey: string,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
) => {
  const response = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: `${feature}.nextTask`,
    value: currentKey,
  })

  setUserSettings(response.settings)
}
