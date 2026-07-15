import type { AccountKey } from '@/shared/stores/sessionStore'
import type { AchievementUnlockerState } from '../types'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

interface AchievementUnlockerStateEventPayload {
  steamId: string
  state: AchievementUnlockerState
}

// Matches src-tauri/src/achievement_unlocker/mod.rs's ACHIEVEMENT_UNLOCKER_STATE_EVENT constant.
const ACHIEVEMENT_UNLOCKER_STATE_EVENT = 'achievement-unlocker-state-changed'

// Same steamId->AccountKey caveat as useCardFarmingSync's identical cache: `emit_state`
// (achievement_unlocker/manager.rs) always carries the resolved SteamID64, not a GamesAccount,
// since `AchievementUnlockerManager`'s sessions are keyed by steam_id for both sign-in modes
// uniformly. The frontend has no synchronous way to turn an agent-mode account's steamId back into
// its `agent:<username>` AccountKey, so it's resolved once per account activation below.
const steamIdToAccountKey = new Map<string, AccountKey>()

// Keeps `achievementUnlockerStore` in sync with the backend regardless of which /dashboard/*
// route is active - mirrors `useCardFarmingSync`/`useIdlingSync` exactly (mounted once from
// `DashboardShell`, not from the achievement-unlocker page itself), since a session runs as its
// own Rust background task and must keep reflecting real progress even while the user is looking
// at a different page.
//
// Only syncs the active account's initial state via `get_achievement_unlocker_state`/
// `resolve_account_steam_id` - matching `useGamesListSync`'s/`useIdlingSync`'s/
// `useCardFarmingSync`'s same scope limit. The event listener
// below is global by nature (Tauri events aren't scoped to one account), so it routes every
// incoming event to the right entry via the resolved steam id cache above - keeping a backgrounded
// account's unlocking progress correct for whenever the account switcher lands, the same way
// gamesListStore's/idlingStore's/cardFarmingStore's entries already do.
export const useAchievementUnlockerSync = () => {
  const account = useSessionStore(state => state.account)
  const setActiveAccount = useAchievementUnlockerStore(state => state.setActiveAccount)
  const updateState = useAchievementUnlockerStore(state => state.updateState)

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

    invoke<AchievementUnlockerState>('get_achievement_unlocker_state', { account })
      .then(state => {
        if (!cancelled) updateState(key, state)
      })
      .catch(error => {
        console.error('Error in (get_achievement_unlocker_state):', error)
      })

    const unlisten = listen<AchievementUnlockerStateEventPayload>(
      ACHIEVEMENT_UNLOCKER_STATE_EVENT,
      event => {
        const eventKey = steamIdToAccountKey.get(event.payload.steamId)
        if (eventKey) updateState(eventKey, event.payload.state)
      },
    )

    return () => {
      cancelled = true
      unlisten.then(fn => fn())
    }
  }, [account, setActiveAccount, updateState])
}
