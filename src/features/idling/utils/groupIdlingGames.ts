import type { IdleOwner } from '../types'

// Display precedence when a game is claimed by more than one owner at once (e.g. manually idled
// while also queued for auto-idle) - each game renders under exactly one section, the first
// matching owner here, rather than appearing twice.
const OWNER_PRECEDENCE: IdleOwner[] = [
  'manual',
  'card_farming',
  'achievement_unlocker',
  'auto_idle',
]

export interface IdlingGroup {
  owner: IdleOwner | 'other'
  appIds: number[]
}

// Groups every currently-idling app id by whichever owner claims it, per OWNER_PRECEDENCE. Any app
// id present in `appIds` but absent from every owner's claim list falls into a trailing `'other'`
// group instead of being silently dropped - covers the claims registry's documented gap where the
// CLI-mode poller can detect an externally-killed process without retracting it from its owner's
// claim, and the inherent race between `get_idle_state`/`get_idle_claims` being two separate calls.
// Groups with no games are omitted.
export function groupIdlingGames(appIds: number[], claimsByOwner: Record<string, number[]>) {
  const remaining = new Set(appIds)
  const groups: IdlingGroup[] = []

  for (const owner of OWNER_PRECEDENCE) {
    const claimed = (claimsByOwner[owner] ?? []).filter(appId => remaining.has(appId))
    if (claimed.length === 0) continue
    for (const appId of claimed) remaining.delete(appId)
    groups.push({ owner, appIds: claimed })
  }

  if (remaining.size > 0) {
    groups.push({ owner: 'other', appIds: [...remaining] })
  }

  return groups
}
