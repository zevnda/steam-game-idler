import type { CardFarmingSettings } from '../types'
import { useCallback, useState } from 'react'
import { useTabGatedLoad } from '@/features/settings/hooks/useTabGatedLoad'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// Backs the card-farming tab in the (app-wide) SettingsModal - mirrors
// useAchievementUnlockerSettings.ts's shape exactly (see that hook's doc comment for why a
// per-account category lives in an otherwise app-wide modal, and why loading is gated on this
// specific tab being active rather than just "modal is open").
export const useCardFarmingSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const [settings, setSettings] = useState<CardFarmingSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!account) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      setSettings(await invoke<CardFarmingSettings>('get_card_farming_settings', { account }))
    } catch (error) {
      console.error('Error in (get_card_farming_settings):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [account])

  useTabGatedLoad(
    isOpen && activeTab === 'cardFarming',
    account ? getAccountKey(account) : null,
    load,
  )

  const save = useCallback(
    async (next: CardFarmingSettings) => {
      if (!account) return false
      setIsSaving(true)
      setActionErrorCode(null)
      try {
        setSettings(
          await invoke<CardFarmingSettings>('set_card_farming_settings', {
            account,
            settings: next,
          }),
        )
        const changedKeys = settings
          ? (Object.keys(next) as (keyof CardFarmingSettings)[]).filter(
              k => next[k] !== settings[k],
            )
          : Object.keys(next)
        logFrontendInfo('useCardFarmingSettings', 'card farming settings saved', { changedKeys })
        return true
      } catch (error) {
        console.error('Error in (set_card_farming_settings):', error)
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
