import type { InvokeSettings, UserSettings, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/components'
import { logEvent } from '@/shared/utils'

export const handleSliderChange = async (
  newInterval: [number, number] | number[] | number,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
) => {
  try {
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'achievementUnlocker.interval',
      value: newInterval,
    })
    setUserSettings(response.settings)
    logEvent(`[Settings - Achievement Unlocker] Changed 'interval' to '${String(newInterval)}'`)
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleSliderChange - Achievement Unlocker):', error)
    logEvent(`[Error] in (handleSliderChange - Achievement Unlocker): ${error}`)
  }
}
