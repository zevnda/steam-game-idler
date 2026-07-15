import type { SteamCookiesLike } from '@/shared/stores/steamCookiesStore'
import { useEffect } from 'react'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSteamCookiesStore } from '@/shared/stores/steamCookiesStore'
import { invoke } from '@/shared/utils/invoke'

// Keeps `steamCookiesStore` in sync with the backend regardless of which /dashboard/* route is
// active - mirrors `useGamesListSync`'s shape (mounted once from `DashboardShell`, not from either
// cookie-gated feature page), except there's no staleness window: a saved cookie set only changes
// via an explicit save/clear/acquire action (Settings' Steam Credentials tab, or either feature's
// own connect panel), and every one of those already writes straight back into this store (see
// steamCookiesStore's own doc comment) - so a one-time check per account activation is enough.
export const useSteamCookiesSync = () => {
  const account = useSessionStore(state => state.account)

  useEffect(() => {
    if (!account) return
    const key = getAccountKey(account)
    const { entries, setActiveAccount, updateEntry } = useSteamCookiesStore.getState()
    setActiveAccount(key)

    if (entries[key]?.isChecked) return
    let cancelled = false

    invoke<SteamCookiesLike | null>('get_steam_credentials', { account })
      .then(savedCookies => {
        if (!cancelled) updateEntry(key, { isChecked: true, savedCookies })
      })
      .catch(error => {
        console.error('Error in (get_steam_credentials):', error)
        // Still marks the account as checked - a failed check must not be treated as "haven't
        // checked yet" forever (that would strand every consumer in a permanent loading state).
        // The account simply falls through to acting as if no cookies are saved, same as before.
        if (!cancelled) updateEntry(key, { isChecked: true, savedCookies: null })
      })

    return () => {
      cancelled = true
    }
  }, [account])
}
