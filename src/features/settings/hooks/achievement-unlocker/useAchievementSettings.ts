import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/shared/stores'

export function useAchievementSettings() {
  const { t } = useTranslation()
  const userSettings = useUserStore(s => s.userSettings)
  const [sliderLabel, setSliderLabel] = useState('')

  useEffect(() => {
    const interval = userSettings.achievementUnlocker?.interval
    setSliderLabel(
      t('settings.achievementUnlocker.interval', { min: interval[0], max: interval[1] }),
    )
  }, [userSettings.achievementUnlocker?.interval, t])

  return { sliderLabel, setSliderLabel }
}
