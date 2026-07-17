import type { SteamCookies } from '../types'
import { useCallback, useEffect, useRef, useState } from 'react'
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
// loads/saves whatever's saved for the signed-in account's resolved SteamID64 regardless. Clearing
// is no longer this hook's own responsibility - `SteamCredentialsTab` now delegates that to the
// shared `SteamCookiesConnectPanel`'s own `useSavedSteamCookies().clear()`, the one implementation
// every surface's Clear button calls.
//
// `load()` still does its own real `get_steam_credentials` fetch on first open per account (in case
// `useSteamCookiesSync` hasn't already checked this account) and writes the result into
// `steamCookiesStore` rather than local state, so `SteamCookiesConnectPanel`'s own read of that same
// store (via `useSavedSteamCookies`) has something to prefill from immediately, without waiting on a
// second, redundant fetch of its own.
export const useSteamCredentialsSettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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

  const isActive = isOpen && activeTab === 'steamCredentials'

  useTabGatedLoad(isActive, account ? getAccountKey(account) : null, load)

  // `SteamCredentialsTab`/`SteamCookiesConnectPanel` unmount and remount fresh every time this tab
  // loses/regains selection (HeroUI's `TabPanel` only mounts the selected tab's children) - but this
  // hook instance itself doesn't; it's created once in `SettingsModal` and lives for the modal's
  // whole session (see this hook's own doc comment). Without this, a stale `actionErrorCode` from a
  // save/acquire attempt made before switching away would still be sitting in this hook's state the
  // next time the user switches back, and get fed straight into the freshly-remounted panel's
  // `errorSlot` - an error alert for an attempt the user can no longer even see the failed input
  // for. Reset on the falling edge (tab was active, now isn't - covers both switching to another
  // settings tab and closing the modal entirely), not on the rising edge, so the alert doesn't
  // flicker away while still actively viewing it.
  const wasActiveRef = useRef(false)
  useEffect(() => {
    if (wasActiveRef.current && !isActive) {
      setActionErrorCode(null)
    }
    wasActiveRef.current = isActive
  }, [isActive])

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
    isLoading,
    isSaving,
    isAcquiring,
    loadErrorCode,
    actionErrorCode,
    refresh: load,
    save,
    acquire,
  }
}
