import type { LocalSteamUser, SteamAccount, SteamPlayerSummaryResponse } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { mergeAccounts } from '../utils/mergeAccounts'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

type Phase = 'loading' | 'ready' | 'continuing' | 'success'

// Drives the CLI-mode (local Steam client) sign-in screen: lists every account
// `loginusers.vdf` knows about, layers in persona/avatar data from the Steam Web API (cached
// first, falling back to a live fetch for whatever isn't), and lets the user pick one to sign
// into. Ported behaviorally from `main`'s `useSignIn`, deliberately leaving out the `is_dev`
// bypass and the app-wide user store.
// `loadErrorCode`/`summaryErrorCode`/`actionErrorCode` are deliberately kept as inline Alert
// banners in AccountPicker/LocalSignInScreen, not converted to toasts even though a toast system
// exists now - these are states the user needs to read and act on
// (retry, pick a different account) while still looking at the screen, not one-off transient
// feedback that's fine to miss.
export const useLocalSignIn = () => {
  const [phase, setPhase] = useState<Phase>('loading')
  const [accounts, setAccounts] = useState<SteamAccount[]>([])
  const [selectedSteamId, setSelectedSteamId] = useState<string | null>(null)
  // Set when `get_users` itself fails - CLI mode can't work at all without a readable local Steam
  // install, so this is fatal to the screen, unlike `summaryErrorCode` below.
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  // Set when persona/avatar lookup fails - accounts still list by steam ID/persona name from the
  // VDF alone, so this is a degraded-but-usable state, not fatal.
  const [summaryErrorCode, setSummaryErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const loadAccounts = useCallback(async () => {
    setPhase('loading')
    setLoadErrorCode(null)
    setSummaryErrorCode(null)

    let users: LocalSteamUser[]
    try {
      users = await invoke<LocalSteamUser[]>('get_users')
    } catch (error) {
      console.error('Error in (get_users):', error)
      setLoadErrorCode(String(error))
      setAccounts([])
      setSelectedSteamId(null)
      setPhase('ready')
      return
    }

    let summaries: SteamPlayerSummaryResponse[] = []
    if (users.length > 0) {
      try {
        const cached = await invoke<SteamPlayerSummaryResponse[]>('get_user_summary_cache')
        const cachedIds = new Set(
          cached.flatMap(entry => entry.response?.players?.map(player => player.steamid) ?? []),
        )
        const uncached = users.filter(user => !cachedIds.has(user.steamId))

        let fresh: SteamPlayerSummaryResponse[] = []
        if (uncached.length > 0) {
          const steamId = uncached.map(user => user.steamId).join(',')
          fresh = [await invoke<SteamPlayerSummaryResponse>('get_user_summary', { steamId })]
        }

        summaries = [...cached, ...fresh]
      } catch (error) {
        console.error('Error fetching Steam user summaries:', error)
        setSummaryErrorCode(String(error))
      }
    }

    const merged = mergeAccounts(users, summaries)
    setAccounts(merged)
    setSelectedSteamId(
      merged.find(account => account.mostRecent)?.steamId ?? merged[0]?.steamId ?? null,
    )
    setPhase('ready')
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  // Backs both the explicit refresh button and the fatal-error "try again" action - clearing a
  // cache file that may not even exist is harmless either way.
  const refresh = useCallback(async () => {
    try {
      await invoke('delete_user_summary_file')
    } catch (error) {
      console.error('Error in (delete_user_summary_file):', error)
    }
    await loadAccounts()
  }, [loadAccounts])

  // `loginusers.vdf`/the `AutoLoginUser` registry value are rewritten as soon as a non-active
  // account is selected (matching `main`'s real behavior), not deferred until Continue is
  // pressed - Continue only decides whether Steam itself needs killing/relaunching or launching.
  const selectAccount = useCallback(
    (steamId: string) => {
      setSelectedSteamId(steamId)
      const account = accounts.find(a => a.steamId === steamId)
      if (account && !account.mostRecent) {
        invoke('prepare_steam_account_switch', { steamId }).catch(error => {
          console.error('Error in (prepare_steam_account_switch):', error)
        })
      }
    },
    [accounts],
  )

  const continueSignIn = useCallback(async () => {
    const account = accounts.find(a => a.steamId === selectedSteamId)
    if (!account) {
      return
    }

    setActionErrorCode(null)
    setPhase('continuing')

    try {
      if (!account.mostRecent) {
        // VDF + registry were already rewritten in `selectAccount` - just restart Steam so it
        // picks up the change.
        await invoke('switch_steam_account')
      } else {
        const isRunning = await invoke<boolean>('is_steam_running')
        if (!isRunning) {
          await invoke('launch_steam')
        }
      }
      useSessionStore.getState().setAccount({ mode: 'local', steamId: account.steamId })
      logFrontendInfo('useLocalSignIn', 'local sign-in completed', { steamId: account.steamId })
      setPhase('success')
    } catch (error) {
      console.error('Error completing local sign-in:', error)
      setActionErrorCode(String(error))
      setPhase('ready')
    }
  }, [accounts, selectedSteamId])

  return {
    phase,
    accounts,
    selectedSteamId,
    loadErrorCode,
    summaryErrorCode,
    actionErrorCode,
    selectAccount,
    continueSignIn,
    refresh,
  }
}
