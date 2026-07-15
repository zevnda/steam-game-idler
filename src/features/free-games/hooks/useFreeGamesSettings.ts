import type { FreeGamesSettings } from '../types'
import { useCallback, useState } from 'react'
import { useTabGatedLoad } from '@/features/settings/hooks/useTabGatedLoad'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// Backs the Free Games tab in the (app-wide) SettingsModal - mirrors
// useAchievementUnlockerSettings.ts's shape (per-account category, tab-gated load) for the
// `autoRedeem` toggle itself. Loads only while this specific tab is active, same convention every
// other per-account tab uses.
export const useFreeGamesSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const [settings, setSettings] = useState<FreeGamesSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEstablishingSession, setIsEstablishingSession] = useState(false)
  const [isClearingSession, setIsClearingSession] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!account) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      setSettings(await invoke<FreeGamesSettings>('get_free_games_settings', { account }))
    } catch (error) {
      console.error('Error in (get_free_games_settings):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [account])

  useTabGatedLoad(
    isOpen && activeTab === 'freeGames',
    account ? getAccountKey(account) : null,
    load,
  )

  const save = useCallback(
    async (next: FreeGamesSettings) => {
      if (!account) return false
      setIsSaving(true)
      setActionErrorCode(null)
      try {
        setSettings(
          await invoke<FreeGamesSettings>('set_free_games_settings', { account, settings: next }),
        )
        const changedKeys = settings
          ? (Object.keys(next) as (keyof FreeGamesSettings)[]).filter(k => next[k] !== settings[k])
          : Object.keys(next)
        logFrontendInfo('useFreeGamesSettings', 'free games settings saved', { changedKeys })
        return true
      } catch (error) {
        console.error('Error in (set_free_games_settings):', error)
        setActionErrorCode(String(error))
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [account, settings],
  )

  // Agent-mode-only: a plain toggle, since agent mode needs no store session at all to auto-redeem
  // (see `mod.rs`'s doc comment on `RequestFreeLicense`) - CLI mode instead uses
  // `establishSession`/`clearSession` below, which double as the on/off control for that mode.
  const toggleAutoRedeem = useCallback(
    async (enabled: boolean) => save({ autoRedeem: enabled }),
    [save],
  )

  // CLI-mode-only: establishes (or refreshes) this account's persisted Steam store session, then
  // turns auto-redeem on - a real, visible login window on first use, matching `main`'s own
  // "Sign in to Steam"/"Reauthenticate" button (same handler either way, see FreeGamesSettings.tsx),
  // silent every time after since the session persists in this account's own webview profile.
  const establishSession = useCallback(async () => {
    if (!account) return false
    setIsEstablishingSession(true)
    setActionErrorCode(null)
    try {
      await invoke('ensure_free_games_store_session', { account })
      logFrontendInfo('useFreeGamesSettings', 'free games store session established')
    } catch (error) {
      console.error('Error in (ensure_free_games_store_session):', error)
      setActionErrorCode(String(error))
      setIsEstablishingSession(false)
      return false
    }
    setIsEstablishingSession(false)
    return save({ autoRedeem: true })
  }, [account, save])

  // CLI-mode-only: signs the persisted store session out and turns auto-redeem off - matches
  // `main`'s "Sign out" button.
  const clearSession = useCallback(async () => {
    if (!account) return false
    setIsClearingSession(true)
    setActionErrorCode(null)
    try {
      await invoke('clear_free_games_store_session', { account })
      logFrontendInfo('useFreeGamesSettings', 'free games store session cleared')
    } catch (error) {
      console.error('Error in (clear_free_games_store_session):', error)
      setActionErrorCode(String(error))
      setIsClearingSession(false)
      return false
    }
    setIsClearingSession(false)
    return save({ autoRedeem: false })
  }, [account, save])

  return {
    settings,
    isLoading,
    isSaving,
    isEstablishingSession,
    isClearingSession,
    loadErrorCode,
    actionErrorCode,
    refresh: load,
    toggleAutoRedeem,
    establishSession,
    clearSession,
  }
}
