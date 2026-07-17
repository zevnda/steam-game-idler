import type { AccountKey } from '@/shared/stores/sessionStore'
import type { FarmingState } from '../types'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'
import { clearSavedSteamCookiesByKey } from '@/shared/utils/steamCommunitySessionExpired'

interface FarmingStateEventPayload {
  steamId: string
  state: FarmingState
}

// Matches src-tauri/src/card_farming/mod.rs's FARMING_STATE_EVENT constant.
const FARMING_STATE_EVENT = 'card-farming-state-changed'

// Unlike idling's IDLE_STATE_EVENT (which carries the account's username directly, see
// useIdlingSync), card farming's event only carries the resolved SteamID64 -
// `CardFarmingManager`'s sessions are keyed by steam_id, not by GamesAccount, since that's what
// `resolve_steam_id` already normalizes both sign-in modes down to (see games/commands.rs). The
// frontend has no synchronous way to know an agent-mode account's SteamID64 (only the backend's
// live daemon session resolves one - see useGamesListSync's identical caveat for local-mode-only
// cache reads), so this cache is populated by resolving it once per account activation below, not
// derived from anything already in sessionStore.
const steamIdToAccountKey = new Map<string, AccountKey>()

// Keeps `cardFarmingStore` in sync with the backend regardless of which /dashboard/* route is
// active - mirrors `useIdlingSync` exactly (mounted once from `DashboardShell`, not from the
// card-farming page itself), since a farming cycle runs as its own Rust background task and must
// keep reflecting real progress even while the user is looking at a different page.
//
// Only syncs the active account's initial state via `get_farming_state`/`resolve_account_steam_id`
// - matching `useGamesListSync`'s/`useIdlingSync`'s same scope limit. The event listener below is
// global by nature (Tauri events aren't scoped to one
// account), so it routes every incoming event to the right entry via the resolved steam id cache
// above - keeping a backgrounded account's farming progress correct for whenever the account
// switcher lands, the same way gamesListStore's/idlingStore's entries already do.
export const useCardFarmingSync = () => {
  const account = useSessionStore(state => state.account)
  const setActiveAccount = useCardFarmingStore(state => state.setActiveAccount)
  const updateState = useCardFarmingStore(state => state.updateState)

  useEffect(() => {
    if (!account) return
    const key = getAccountKey(account)
    setActiveAccount(key)
    let cancelled = false

    invoke<string>('resolve_account_steam_id', { account })
      .then(steamId => {
        if (!cancelled) steamIdToAccountKey.set(steamId, key)
      })
      .catch(error => {
        console.error('Error in (resolve_account_steam_id):', error)
      })

    invoke<FarmingState>('get_farming_state', { account })
      .then(state => {
        if (!cancelled) updateState(key, state)
      })
      .catch(error => {
        console.error('Error in (get_farming_state):', error)
      })

    const unlisten = listen<FarmingStateEventPayload>(FARMING_STATE_EVENT, event => {
      const eventKey = steamIdToAccountKey.get(event.payload.steamId)
      if (!eventKey) return
      updateState(eventKey, event.payload.state)
      // Fires regardless of whether the card-farming page is mounted - a backgrounded account's
      // cycle (started via useAutoFarmCards, or just left running while the user navigated away)
      // can expire without useCardFarming's page-local effect ever seeing it, so the cached-cookie
      // cleanup has to live here rather than there. See steamCommunitySessionExpired.ts.
      if (event.payload.state.sessionExpired) {
        clearSavedSteamCookiesByKey(eventKey)
      }
    })

    return () => {
      cancelled = true
      unlisten.then(fn => fn())
    }
  }, [account, setActiveAccount, updateState])
}
