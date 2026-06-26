import type { InvokeSettings, UserSettings, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/components'
import { logEvent } from '@/shared/utils'

export const handleMultipleGamesChange = async (
  checked: boolean,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
) => {
  try {
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'achievementUnlocker.multipleGames',
      value: checked,
    })
    setUserSettings(response.settings)
    logEvent(`[Settings - Achievement Unlocker] Changed 'multipleGames' to '${checked}'`)
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleMultipleGamesChange):', error)
    logEvent(`[Error] in (handleMultipleGamesChange): ${error}`)
  }
}
