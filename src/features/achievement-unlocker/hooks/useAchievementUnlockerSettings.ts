import type { AchievementUnlockerSettings } from '../types'
import { useCallback, useState } from 'react'
import { useTabGatedLoad } from '@/features/settings/hooks/useTabGatedLoad'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// Backs the achievement-unlocker tab in the (app-wide) SettingsModal, even though this data is
// per-account, not app-wide. The modal itself stays the one place every settings category lives
// (Settings is a modal, not a route), but each tab's hook is free to fetch/save against whatever
// backend shape its own category actually needs - this one calls the per-account
// get/set_achievement_unlocker_settings commands instead of the general tab's app-wide
// get_settings/set_steam_web_api_key.
//
// Loads only while this specific tab is active (not just "modal is open", unlike the general tab,
// which has nothing else to gate on since it's the only category today) - no point fetching an
// account-scoped settings file the user hasn't navigated to yet.
export const useAchievementUnlockerSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const [settings, setSettings] = useState<AchievementUnlockerSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!account) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      setSettings(
        await invoke<AchievementUnlockerSettings>('get_achievement_unlocker_settings', {
          account,
        }),
      )
    } catch (error) {
      console.error('Error in (get_achievement_unlocker_settings):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [account])

  useTabGatedLoad(
    isOpen && activeTab === 'achievementUnlocker',
    account ? getAccountKey(account) : null,
    load,
  )

  const save = useCallback(
    async (next: AchievementUnlockerSettings) => {
      if (!account) return false
      setIsSaving(true)
      setActionErrorCode(null)
      try {
        setSettings(
          await invoke<AchievementUnlockerSettings>('set_achievement_unlocker_settings', {
            account,
            settings: next,
          }),
        )
        const changedKeys = settings
          ? (Object.keys(next) as (keyof AchievementUnlockerSettings)[]).filter(
              k => next[k] !== settings[k],
            )
          : Object.keys(next)
        logFrontendInfo('useAchievementUnlockerSettings', 'achievement unlocker settings saved', {
          changedKeys,
        })
        return true
      } catch (error) {
        console.error('Error in (set_achievement_unlocker_settings):', error)
        setActionErrorCode(String(error))
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [account, settings],
  )

  return {
    settings,
    isLoading,
    isSaving,
    loadErrorCode,
    actionErrorCode,
    refresh: load,
    save,
  }
}
