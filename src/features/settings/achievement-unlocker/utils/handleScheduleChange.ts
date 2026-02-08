import type { InvokeSettings, UserSettings, UserSummary } from '@/shared/types'
import type { TimeInputValue } from '@heroui/react'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/ui'
import { logEvent } from '@/shared/utils'

export const handleScheduleChange = async (
  value: TimeInputValue | null,
  type: 'scheduleFrom' | 'scheduleTo',
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
) => {
  try {
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: `achievementUnlocker.${type}`,
      value,
    })
    setUserSettings(response.settings)
    logEvent(`[Settings - Achievement Unlocker] Changed '${type}' to '${String(value)}'`)
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleScheduleChange):', error)
    logEvent(`[Error] in (handleScheduleChange): ${error}`)
  }
}
