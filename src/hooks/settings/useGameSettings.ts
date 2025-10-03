import type { GameSpecificSettings, InvokeSettings } from '@/types'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useRef, useState } from 'react'

import { useUserContext } from '@/components/contexts/UserContext'

interface UseGameSettingsProps {
  appId?: number | string
}

interface UseGameSettingsReturn {
  maxIdleTime: number
  maxCardDrops: number
  maxAchievementUnlocks: number
  setMaxIdleTime: (value: number) => void
  setMaxCardDrops: (value: number) => void
  setMaxAchievementUnlocks: (value: number) => void
  handleMaxIdleTimeChange: (value: number) => void
  handleMaxCardDropsChange: (value: number) => void
  handleMaxAchievementUnlocksChange: (value: number) => void
  resetSettings: () => void
}

export function useGameSettings({ appId }: UseGameSettingsProps = {}): UseGameSettingsReturn {
  const { userSummary, userSettings, setUserSettings } = useUserContext()
  const [maxIdleTime, setMaxIdleTime] = useState(0)
  const [maxCardDrops, setMaxCardDrops] = useState(0)
  const [maxAchievementUnlocks, setMaxAchievementUnlocks] = useState(0)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    const fetchGameSettings = async (): Promise<void> => {
      const gameSettings: GameSpecificSettings =
        (userSettings.gameSettings && appId && userSettings.gameSettings[appId]) || {}
      setMaxIdleTime(gameSettings.maxIdleTime || 0)
      setMaxCardDrops(gameSettings.maxCardDrops || 0)
      setMaxAchievementUnlocks(gameSettings.maxAchievementUnlocks || 0)
      isInitializedRef.current = true
    }
    isInitializedRef.current = false
    fetchGameSettings()
  }, [appId, userSettings.gameSettings])

  const handleMaxIdleTimeChange = (value: number): void => {
    const newValue = value || 0
    setMaxIdleTime(newValue)
    if (isInitializedRef.current && appId) {
      saveWithValues(newValue, maxCardDrops, maxAchievementUnlocks)
    }
  }

  const handleMaxAchievementUnlocksChange = (value: number): void => {
    const newValue = value || 0
    setMaxAchievementUnlocks(newValue)
    if (isInitializedRef.current && appId) {
      saveWithValues(maxIdleTime, maxCardDrops, newValue)
    }
  }

  const handleMaxCardDropsChange = (value: number): void => {
    const newValue = value || 0
    setMaxCardDrops(newValue)
    if (isInitializedRef.current && appId) {
      saveWithValues(maxIdleTime, newValue, maxAchievementUnlocks)
    }
  }

  const saveWithValues = async (idleTime: number, cardDrops: number, achievements: number): Promise<void> => {
    if (!appId) return

    const gameSettings = userSettings.gameSettings || {}

    gameSettings[appId] = {
      ...gameSettings[appId],
      maxIdleTime: idleTime,
      maxCardDrops: cardDrops,
      maxAchievementUnlocks: achievements,
    }

    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'gameSettings',
      value: gameSettings,
    })

    setUserSettings(updateResponse.settings)
  }

  const resetSettings = (): void => {
    if (!appId) {
      setMaxIdleTime(0)
      setMaxCardDrops(0)
      setMaxAchievementUnlocks(0)
      return
    }

    const gameSettings: GameSpecificSettings = (userSettings.gameSettings && userSettings.gameSettings[appId]) || {}
    setMaxIdleTime(gameSettings.maxIdleTime || 0)
    setMaxCardDrops(gameSettings.maxCardDrops || 0)
    setMaxAchievementUnlocks(gameSettings.maxAchievementUnlocks || 0)
  }

  return {
    maxIdleTime,
    maxCardDrops,
    maxAchievementUnlocks,
    setMaxIdleTime,
    setMaxCardDrops,
    setMaxAchievementUnlocks,
    handleMaxIdleTimeChange,
    handleMaxCardDropsChange,
    handleMaxAchievementUnlocksChange,
    resetSettings,
  }
}
