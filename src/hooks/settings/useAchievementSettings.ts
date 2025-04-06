import type { InvokeSettings, UserSettings, UserSummary } from '@/types'
import type { Time } from '@internationalized/date'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useUserContext } from '@/components/contexts/UserContext'
import { logEvent } from '@/utils/tasks'
import { showDangerToast, t } from '@/utils/toasts'

interface AchievementSettingsHook {
  sliderLabel: string
  setSliderLabel: Dispatch<SetStateAction<string>>
}

export const useAchievementSettings = (): AchievementSettingsHook => {
  const { t } = useTranslation()
  const { userSettings } = useUserContext()
  const [sliderLabel, setSliderLabel] = useState('')

  // Sync local settings with global settings when they change
  useEffect(() => {
    const interval = userSettings.achievementUnlocker?.interval
    setSliderLabel(
      t('settings.achievementUnlocker.interval', {
        min: interval[0],
        max: interval[1],
      }),
    )
  }, [userSettings.achievementUnlocker?.interval, setSliderLabel, t])

  return { sliderLabel, setSliderLabel }
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
      key: 'achievementUnlocker.interval',
      value: newInterval,
    })
    setUserSettings(response.settings)
    logEvent(`[Settings - Achievement Unlocker] Changed 'interval' to '${String(newInterval)}'`)
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleSliderChange):', error)
    logEvent(`[Error] in (handleSliderChange): ${error}`)
  }
}

// Handle changes to the schedule in the settings
export const handleScheduleChange = async (
  value: Time | null,
  type: 'scheduleFrom' | 'scheduleTo',
  userSummary: UserSummary,
  setUserSettings: Dispatch<SetStateAction<UserSettings>>,
): Promise<void> => {
  try {
    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: `achievementUnlocker.${type}`,
      value,
    })
    setUserSettings(response.settings)
    logEvent(`[Settings - Achievement Unlocker] Changed '${type}' to '${String(value)}'`)
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleScheduleChange):', error)
    logEvent(`[Error] in (handleScheduleChange): ${error}`)
  }
}
