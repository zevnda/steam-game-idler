import { isEnabled } from '@tauri-apps/plugin-autostart'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/shared/stores'

export function useGeneralSettings() {
  const userSettings = useUserStore(s => s.userSettings)
  const [startupState, setStartupState] = useState<boolean | null>(null)
  const [keyValue, setKeyValue] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [sliderLabel, setSliderLabel] = useState('')

  useEffect(() => {
    isEnabled().then(setStartupState)
  }, [])

  useEffect(() => {
    const apiKey = userSettings.general.apiKey
    if (apiKey && apiKey.length > 0) {
      setHasKey(true)
      setKeyValue(apiKey)
    }
  }, [userSettings.general.apiKey])

  return {
    startupState,
    setStartupState,
    keyValue,
    setKeyValue,
    hasKey,
    setHasKey,
    sliderLabel,
    setSliderLabel,
  }
}
