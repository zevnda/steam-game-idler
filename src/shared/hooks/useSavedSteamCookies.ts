import type { SteamCookiesLike } from '@/shared/stores/steamCookiesStore'
import { useCallback } from 'react'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSteamCookiesStore } from '@/shared/stores/steamCookiesStore'
import { invoke } from '@/shared/utils/invoke'

// Thin reader/writer over `steamCookiesStore` - the actual check happens once per account in
// `useSteamCookiesSync` (mounted in `DashboardShell`, see its own doc comment), not here. Kept as
// its own hook (rather than every caller reading the store directly) since `save` also needs to
// persist to the OS credential store, not just update local state - shared by the Settings modal's
// Steam Credentials tab and every feature-page cookie prompt (CardFarmingStartPanel/
// InventoryConnectPanel via SteamCookiesConnectPanel) so a manual set entered on any one of those
// screens is visible on the others too, instead of three independent credential silos. `T` is each
// caller's own local `SteamCookies` type - those types stay per-feature by existing precedent,
// this hook works structurally rather than forcing one shared nominal type.
export function useSavedSteamCookies<T extends SteamCookiesLike>() {
  const account = useSessionStore(state => state.account)
  const isLoaded = useSteamCookiesStore(state => state.isChecked)
  const savedCookies = useSteamCookiesStore(state => state.savedCookies) as T | null

  // Fire-and-forget: the caller already has the cookies the user just typed, so a save failure
  // here isn't worth blocking or erroring the caller's own start/connect action over - worst case
  // it's simply not remembered for next time (logged for diagnosis either way). Updates the store
  // immediately (not just on the invoke's success) so every other consumer (the connect panels,
  // the other settings/page instances) reflects the new value right away.
  const save = useCallback(
    (cookies: T) => {
      if (!account) return
      const key = getAccountKey(account)
      useSteamCookiesStore.getState().updateEntry(key, { isChecked: true, savedCookies: cookies })
      invoke('set_steam_credentials', { account, cookies }).catch(error =>
        console.error('Error in (set_steam_credentials):', error),
      )
    },
    [account],
  )

  return { savedCookies, isLoaded, save }
}
