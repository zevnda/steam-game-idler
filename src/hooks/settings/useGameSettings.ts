import type { GameSettings, GameSpecificSettings, InvokeSettings } from '@/types'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useRef, useState } from 'react'
import { useUserStore } from '@/stores/userStore'

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
  globalMaxIdleTime: number
  setGlobalMaxIdleTime: (value: number) => void
  handleGlobalMaxIdleTimeChange: (value: number) => void
}

export function useGameSettings({ appId }: UseGameSettingsProps = {}): UseGameSettingsReturn {
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const [maxIdleTime, setMaxIdleTime] = useState(0)
  const [maxCardDrops, setMaxCardDrops] = useState(0)
  const [maxAchievementUnlocks, setMaxAchievementUnlocks] = useState(0)
  const [globalMaxIdleTime, setGlobalMaxIdleTime] = useState(0)
  const isInitializedRef = useRef(false)

  // Type guard for GameSpecificSettings
  function isGameSpecificSettings(val: unknown): val is GameSpecificSettings {
    return typeof val === 'object' && val !== null && !Array.isArray(val)
  }

  useEffect(() => {
    const fetchGameSettings = async (): Promise<void> => {
      let gameSettings: GameSpecificSettings = {}
      if (userSettings.gameSettings && appId && isGameSpecificSettings(userSettings.gameSettings[appId])) {
        gameSettings = userSettings.gameSettings[appId] as GameSpecificSettings
      }
      setMaxIdleTime(gameSettings.maxIdleTime || 0)
      setMaxCardDrops(gameSettings.maxCardDrops || 0)
      setMaxAchievementUnlocks(gameSettings.maxAchievementUnlocks || 0)
      setGlobalMaxIdleTime(
        (userSettings.gameSettings && (userSettings.gameSettings as GameSettings).globalMaxIdleTime) || 0,
      )
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

    // Only assign to appId if not globalMaxIdleTime
    if (appId !== 'globalMaxIdleTime') {
      gameSettings[appId] = {
        ...(isGameSpecificSettings(gameSettings[appId]) ? gameSettings[appId] : {}),
        maxIdleTime: idleTime,
        maxCardDrops: cardDrops,
        maxAchievementUnlocks: achievements,
      }
    }

    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'gameSettings',
      value: gameSettings,
    })

    setUserSettings(updateResponse.settings)
  }

  const saveGlobalMaxIdleTime = async (value: number): Promise<void> => {
    const gameSettings = { ...(userSettings.gameSettings || {}) }
    ;(gameSettings as GameSettings).globalMaxIdleTime = value

    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'gameSettings',
      value: gameSettings,
    })

    setUserSettings(updateResponse.settings)
  }

  const handleGlobalMaxIdleTimeChange = (value: number): void => {
    const newValue = value || 0
    setGlobalMaxIdleTime(newValue)
    saveGlobalMaxIdleTime(newValue)
  }

  const resetSettings = (): void => {
    if (!appId) {
      setMaxIdleTime(0)
      setMaxCardDrops(0)
      setMaxAchievementUnlocks(0)
      return
    }

    let gameSettings: GameSpecificSettings = {}
    if (userSettings.gameSettings && isGameSpecificSettings(userSettings.gameSettings[appId])) {
      gameSettings = userSettings.gameSettings[appId] as GameSpecificSettings
    }
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
    globalMaxIdleTime,
    setGlobalMaxIdleTime,
    handleGlobalMaxIdleTimeChange,
  }
}
