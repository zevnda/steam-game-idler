import type { InvokeSettings, UserSettings, UserSummary } from '@/shared/types'
import type { TimeInputValue } from '@heroui/react'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { useUserStore } from '@/shared/stores'
import { logEvent, showDangerToast } from '@/shared/utils'

export const useAchievementSettings = () => {
  const { t } = useTranslation()
  const userSettings = useUserStore(state => state.userSettings)
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

// Handle changes to the schedule in the settings
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

export const handleNextTaskChangeAchievementUnlocker = async (
  currentKey: string,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings) => void,
) => {
  const response = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'achievementUnlocker.nextTask',
    value: currentKey,
  })

  setUserSettings(response.settings)
}
