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
// Every action that actually changes the saved cookie set also writes straight through to
// `steamCookiesStore` (not just this hook's own local `cookies` state) - that store is what
// `useAutoConnectSteamCookies` reads on the card-farming/inventory-manager pages, checked once per
// account by `useSteamCookiesSync` rather than re-fetched on every page visit (see that store's
// own doc comment). Without this, clearing/saving/acquiring credentials here wouldn't be visible
// to those pages until the next app restart.
export const useSteamCredentialsSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const [cookies, setCookies] = useState<SteamCookies | null>(null)
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
      setCookies(await invoke<SteamCookies | null>('get_steam_credentials', { account }))
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
        setCookies(next)
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
      setCookies(null)
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
      setCookies(acquired)
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
