import { isEnabled } from '@tauri-apps/plugin-autostart'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/shared/stores'

export const useGeneralSettings = () => {
  const userSettings = useUserStore(state => state.userSettings)
  const [startupState, setStartupState] = useState<boolean | null>(null)
  const [keyValue, setKeyValue] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [sliderLabel, setSliderLabel] = useState('')

  useEffect(() => {
    // Check the current state of auto start
    const checkStartupState = async () => {
      const isEnabledState = await isEnabled()
      setStartupState(isEnabledState)
    }
    checkStartupState()
  }, [])

  useEffect(() => {
    // Load Steam web API key from user settings
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
