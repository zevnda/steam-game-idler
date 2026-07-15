import type { AchievementUnlockerSettings } from '@/features/achievement-unlocker/types'
import { useEffect } from 'react'
import { resolveMaxConcurrentGames } from '@/features/achievement-unlocker/utils/resolveMaxConcurrentGames'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'

// Mounted once in DashboardShell alongside usePresenceProGuard, which this mirrors - same
// `isSubscribed !== null` gating and same trigger (useCheckSubscription's 3-hour recheck, or a
// manual license clear/restore), for a different downgrade side effect: unlike every other
// automation loop in this rewrite (card farming, auto games-list update, free-game auto-redeem, all
// of which re-check tier access fresh on every tick), the achievement unlocker's multi-game
// concurrency is otherwise only ever resolved once at `start()` - see
// `achievement_unlocker::manager`'s doc comment. A long-running session (queue kept topped up)
// would otherwise keep running at its old tier's concurrency indefinitely after a downgrade (or
// miss an upgrade), with no natural point where it re-checks. Pushes a corrected worker count to
// any currently-running session via `update_achievement_unlocker_concurrency` whenever the tier
// changes (in either direction - a restored subscription is honored too, matching this app's other
// gates) via `resolveMaxConcurrentGames`'s tier ladder - takes effect at the start of that
// session's *next* pass, never interrupting a game mid-unlock.
export const useAchievementUnlockerConcurrencyGuard = () => {
  const accounts = useSessionStore(state => state.accounts)
  const entries = useAchievementUnlockerStore(state => state.entries)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)

  useEffect(() => {
    if (isSubscribed === null) return

    Object.entries(accounts)
      .filter(([key]) => entries[key]?.isRunning)
      .forEach(async ([, account]) => {
        try {
          const settings = await invoke<AchievementUnlockerSettings>(
            'get_achievement_unlocker_settings',
            { account },
          )
          const maxConcurrentGames = resolveMaxConcurrentGames(
            subscriptionTier,
            settings.multipleGames,
          )
          await invoke('update_achievement_unlocker_concurrency', { account, maxConcurrentGames })
        } catch (error) {
          console.error(
            'Error in (update_achievement_unlocker_concurrency) for concurrency guard:',
            error,
          )
        }
      })
  }, [accounts, entries, isSubscribed, subscriptionTier])
}
