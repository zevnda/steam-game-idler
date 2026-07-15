import type { Settings } from '@/features/settings/types'
import { useEffect } from 'react'
import { silentlyRefreshGamesList } from '@/features/games-list/hooks/useGamesListSync'
import { useAutoUpdateGamesListStore } from '@/shared/stores/autoUpdateGamesListStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'

// `games::commands::get_owned_games` (src-tauri/src/games/commands.rs) calls the Steam Web API's
// `GetOwnedGames` for playtime enrichment in *both* sign-in modes (see that command's doc comment
// and `useGamesListSync.ts`'s own `STALE_AFTER_MS` comment) - so the interval here is chosen by
// which API key pays for the call, not by sign-in mode. A user-supplied key override (Settings >
// General) spends only that user's own ~100k-calls/day budget, so it's safe to poll aggressively.
// Everyone else shares the app's single built-in embedded key across all ~1,850 DAU for every
// feature that uses it, not just this one - 5 minutes is 3x faster than `main`'s 15-minute
// baseline while staying conservative against that shared budget, since real gamer-tier adoption
// isn't measured yet. Tune these two constants if usage data later says otherwise.
const OWN_KEY_INTERVAL_MS = 1 * 60 * 1000
const SHARED_KEY_INTERVAL_MS = 5 * 60 * 1000

// Mounted once in DashboardShell (never unmounted within /dashboard/*), mirroring
// `useAntiAwayStatus`'s two-effect shape: hydrate the store from the real persisted settings once,
// then start/stop the interval live as `enabled`/`hasCustomApiKey` change - not just once at mount
// - so toggling the switch (or saving/clearing the API key) in GeneralSettingsTab takes effect
// immediately. Scoped to only the active account, matching `useGamesListSync`'s/`useIdlingSync`'s/
// `useCardFarmingSync`'s own established scope limit rather
// than fanning out to every concurrently signed-in account.
export const useAutoUpdateGamesListStatus = () => {
  const account = useSessionStore(state => state.account)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const enabled = useAutoUpdateGamesListStore(state => state.enabled)
  const hasCustomApiKey = useAutoUpdateGamesListStore(state => state.hasCustomApiKey)
  const setEnabled = useAutoUpdateGamesListStore(state => state.setEnabled)
  const setHasCustomApiKey = useAutoUpdateGamesListStore(state => state.setHasCustomApiKey)

  useEffect(() => {
    invoke<Settings>('get_settings')
      .then(settings => {
        setEnabled(settings.autoUpdateGamesList)
        setHasCustomApiKey(Boolean(settings.steamWebApiKey))
      })
      .catch(error => {
        console.error('Error in (get_settings) for auto-update-games-list hydration:', error)
      })
    // Intentionally runs once per mount, not per setter identity change - a one-time hydration
    // from disk, same reasoning as useAntiAwayStatus's identical effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Defense in depth: even if `enabled` persisted `true` from an active subscription that's
    // since lapsed, a stale toggle can't keep polling once `hasCasualAccess` goes false - this is
    // a Casual-tier gate (2026-07-15, see PRO_TIER.md), not gamer-only.
    if (!enabled || !account || !hasCasualAccess(subscriptionTier)) return

    const intervalMs = hasCustomApiKey ? OWN_KEY_INTERVAL_MS : SHARED_KEY_INTERVAL_MS
    const interval = setInterval(() => silentlyRefreshGamesList(account), intervalMs)
    return () => clearInterval(interval)
  }, [enabled, hasCustomApiKey, account, subscriptionTier])
}
