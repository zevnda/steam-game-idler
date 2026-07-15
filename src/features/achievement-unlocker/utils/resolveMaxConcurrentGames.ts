import type { ProTier } from '@/shared/utils/subscriptionAccess'
import { CASUAL_MAX_CONCURRENT_GAMES, MAX_CONCURRENT_GAMES } from '../types'
import { hasCasualAccess, hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Resolves the actual worker count to pass to start_achievement_unlocker/
// update_achievement_unlocker_concurrency for a given tier + the multipleGames setting - Casual
// gets a modest concurrency step (CASUAL_MAX_CONCURRENT_GAMES) rather than the previous
// all-or-nothing gamer-only gate, so it's a real stepping stone between Free's forced single-game
// default and Gamer's full MAX_CONCURRENT_GAMES. Shared by useAchievementUnlockerRun (session
// start) and useAchievementUnlockerConcurrencyGuard (downgrade/upgrade re-check on an
// already-running session) so the ladder logic only lives in one place.
export function resolveMaxConcurrentGames(tier: ProTier, multipleGamesEnabled: boolean) {
  if (!multipleGamesEnabled) return 1
  if (hasGamerAccess(tier)) return MAX_CONCURRENT_GAMES
  if (hasCasualAccess(tier)) return CASUAL_MAX_CONCURRENT_GAMES
  return 1
}
