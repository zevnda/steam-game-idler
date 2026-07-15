import type { AchievementUnlockerSettings } from '../types'
import { useCallback, useState } from 'react'
import { resolveMaxConcurrentGames } from '../utils/resolveMaxConcurrentGames'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'

// Start/stop actions for the achievement-unlocker page. Reads the shared `achievementUnlockerStore`
// (kept current by `useAchievementUnlockerSync`, mounted permanently in `DashboardShell`) rather
// than tracking its own copy of session state - same reasoning `useCardFarming`/`useIdling` already
// established.
//
// `maxConcurrentGames` is resolved here, not on the backend: a fresh settings read combined with
// `resolveMaxConcurrentGames`'s tier ladder decides how much multi-game concurrency applies. This
// keeps the Pro-tier gate entirely frontend-side, matching every other gate in this rewrite (the
// backend just clamps whatever number it's given).
//
// `start` deliberately does NOT apply `start_achievement_unlocker`'s own return value to the store
// (an earlier version of this hook did) - that return value is only a snapshot taken the instant the
// session was spawned. For a session that finishes within a couple of milliseconds (a game that's
// already over its max-playtime cap, has nothing left to unlock, or has only hidden achievements
// left with "skip hidden" on all get dequeued during the very first scan pass -
// `achievement_unlocker::manager`'s scan phase), the backend's real, final
// `ACHIEVEMENT_UNLOCKER_STATE_EVENT` can land and get applied by `useAchievementUnlockerSync` before
// this command's own promise resolves back here - so applying that stale snapshot afterward
// clobbered the already-correct "finished" state with a phantom "still running" one nothing could
// clear (`stop_achievement_unlocker` against an already-ended session is a documented no-op, so
// clicking Stop did nothing - only a full reload's fresh `get_achievement_unlocker_state` fetch
// could recover). `stop` never had this bug since it already relies purely on the event stream -
// `start` now matches that pattern instead of double-sourcing state.
export const useAchievementUnlockerRun = () => {
  const account = useSessionStore(state => state.account)
  const state = useAchievementUnlockerStore(state => state.state)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const start = useCallback(async () => {
    if (!account) return
    setIsStarting(true)
    setErrorCode(null)
    try {
      const settings = await invoke<AchievementUnlockerSettings>(
        'get_achievement_unlocker_settings',
        { account },
      )
      const maxConcurrentGames = resolveMaxConcurrentGames(subscriptionTier, settings.multipleGames)
      await invoke('start_achievement_unlocker', { account, maxConcurrentGames })
    } catch (error) {
      console.error('Error in (start_achievement_unlocker):', error)
      setErrorCode(String(error))
    } finally {
      setIsStarting(false)
    }
  }, [account, subscriptionTier])

  const stop = useCallback(async () => {
    if (!account) return
    setIsStopping(true)
    setErrorCode(null)
    try {
      await invoke('stop_achievement_unlocker', { account })
    } catch (error) {
      console.error('Error in (stop_achievement_unlocker):', error)
      setErrorCode(String(error))
    } finally {
      setIsStopping(false)
    }
  }, [account])

  return { state, isStarting, isStopping, errorCode, start, stop }
}
