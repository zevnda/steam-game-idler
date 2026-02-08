import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/shared/stores'

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
