import type { SteamCookies } from '../types'
import { useCallback, useState } from 'react'
import { useTabGatedLoad } from './useTabGatedLoad'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSteamCookiesStore } from '@/shared/stores/steamCookiesStore'
import { invoke } from '@/shared/utils/invoke'

// Backs the Steam Credentials tab in the (app-wide) SettingsModal - mirrors
// useCardFarmingSettings.ts's shape (per-account category, tab-gated load), except the persisted
// value is `SteamCookies | null` from the OS credential store rather than a settings-file struct
// (see src-tauri/src/steam_community/credentials.rs's doc comment for why). CLI-mode only - the
// component decides whether to show the form at all based on the account's `mode`, this hook just
// loads/saves/clears whatever's saved for the signed-in account's resolved SteamID64 regardless.
//
// `cookies` reads from `steamCookiesStore` directly rather than keeping its own separately-loaded
// copy - that store is the one place `SteamCookiesConnectPanel` (card-farming/inventory-manager)
// and a mid-cycle session-expiry clear (`clearSavedSteamCookiesByKey`) also write through, so this
// tab needs to read it back too or it would keep showing whatever it loaded the very first time it
// was ever opened this session, oblivious to a cookie set entered/invalidated on any other surface
// since (this hook instance stays alive - and `useTabGatedLoad` deliberately never reloads for the
// same account - for as long as `SettingsModal` itself does, the whole session, not just while the
// modal happens to be open). `load()` still does its own real `get_steam_credentials` fetch on
// first open per account (in case `useSteamCookiesSync` hasn't already checked this account) and
// writes the result into the shared store rather than local state, so every subsequent render
// (from any surface's action, not just this tab's own) shows the same live value.
export const useSteamCredentialsSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const cookies = useSteamCookiesStore(state => state.savedCookies) as SteamCookies | null
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isAcquiring, setIsAcquiring] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!account) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      const fetched = await invoke<SteamCookies | null>('get_steam_credentials', { account })
      useSteamCookiesStore
        .getState()
        .updateEntry(getAccountKey(account), { isChecked: true, savedCookies: fetched })
    } catch (error) {
      console.error('Error in (get_steam_credentials):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [account])

  useTabGatedLoad(
    isOpen && activeTab === 'steamCredentials',
    account ? getAccountKey(account) : null,
    load,
  )

  const save = useCallback(
    async (next: SteamCookies) => {
      if (!account) return false
      setIsSaving(true)
      setActionErrorCode(null)
      try {
        // Validates against Steam Community before persisting - unlike `set_steam_credentials`
        // (used elsewhere once cookies are already known-good, see that command's doc comment),
        // this tab has no separate "prove it works" step of its own before this call.
        await invoke('validate_and_save_steam_credentials', { account, cookies: next })
        useSteamCookiesStore
          .getState()
          .updateEntry(getAccountKey(account), { isChecked: true, savedCookies: next })
        return true
      } catch (error) {
        console.error('Error in (set_steam_credentials):', error)
        setActionErrorCode(String(error))
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [account],
  )

  const clear = useCallback(async () => {
    if (!account) return false
    setIsClearing(true)
    setActionErrorCode(null)
    try {
      await invoke('clear_steam_credentials', { account })
      useSteamCookiesStore
        .getState()
        .updateEntry(getAccountKey(account), { isChecked: true, savedCookies: null })
      return true
    } catch (error) {
      console.error('Error in (clear_steam_credentials):', error)
      setActionErrorCode(String(error))
      return false
    } finally {
      setIsClearing(false)
    }
  }, [account])

  // Gamer-tier-only automatic sign-in (mirrors CardFarmingStartPanel/InventoryConnectPanel's own
  // automatic option, gated the same way by the caller) - runs the acquisition flow and persists
  // the result via `acquire_and_save_steam_credentials` in one round trip, rather than acquiring
  // then calling `save` separately.
  const acquire = useCallback(async () => {
    if (!account) return false
    setIsAcquiring(true)
    setActionErrorCode(null)
    try {
      const acquired = await invoke<SteamCookies>('acquire_and_save_steam_credentials', { account })
      useSteamCookiesStore
        .getState()
        .updateEntry(getAccountKey(account), { isChecked: true, savedCookies: acquired })
      return true
    } catch (error) {
      console.error('Error in (acquire_and_save_steam_credentials):', error)
      setActionErrorCode(String(error))
      return false
    } finally {
      setIsAcquiring(false)
    }
  }, [account])

  return {
    cookies,
    isLoading,
    isSaving,
    isClearing,
    isAcquiring,
    loadErrorCode,
    actionErrorCode,
    refresh: load,
    save,
    clear,
    acquire,
  }
}
