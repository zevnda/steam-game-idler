import type { AchievementUnlockerState } from '@/features/achievement-unlocker/types'
import type { AccountKey } from './sessionStore'
import { create } from 'zustand'
import { DEFAULT_ACHIEVEMENT_UNLOCKER_STATE } from '@/features/achievement-unlocker/types'

interface AchievementUnlockerStore {
  // Which entry the denormalized `state` below currently mirrors - mirrors cardFarmingStore's/
  // idlingStore's accountKey/entries split exactly (see their doc comments for the full reasoning,
  // not repeated here).
  accountKey: AccountKey | null
  // Unlike idlingStore's entries, an entry here is just `AchievementUnlockerState` verbatim - the
  // backend already reports everything, so there's no frontend-only bookkeeping to derive per
  // account (same reasoning as cardFarmingStore's entries).
  entries: Record<AccountKey, AchievementUnlockerState>
  // Denormalized view of entries[accountKey] - this is the shape Sidebar/useAchievementUnlockerRun
  // already read and doesn't change.
  state: AchievementUnlockerState
  // Makes `key` the active account, seeding a default entry the first time it's seen and pointing
  // the denormalized view at whatever it already has cached otherwise - never touches any other
  // account's entry. Called from useAchievementUnlockerSync only, same as cardFarmingStore/
  // idlingStore.
  setActiveAccount: (key: AccountKey) => void
  // Replaces `key`'s tracked state. Updates the denormalized view too iff `key` is still active by
  // the time this resolves - replaces the old bare `setState` call sites.
  updateState: (key: AccountKey, state: AchievementUnlockerState) => void
  // Drops one account's entry entirely (sign-out) - mirrors cardFarmingStore's/idlingStore's
  // clearEntry.
  clearEntry: (key: AccountKey) => void
}

// Mirrors `cardFarmingStore`'s reasoning exactly: lives here (not in the achievement-unlocker
// page's own component state) so a running session's progress survives navigating away from
// /dashboard/achievement-unlocker and back - `useAchievementUnlockerSync` is mounted once from
// `DashboardShell`, which is never unmounted by route changes within /dashboard/*. Account-keyed
// the same way gamesListStore/idlingStore/cardFarmingStore already are so a backgrounded account's
// unlocking
// progress stays correct once the account switcher lands, instead of one account's events
// clobbering another's view.
export const useAchievementUnlockerStore = create<AchievementUnlockerStore>((set, get) => ({
  accountKey: null,
  entries: {},
  state: DEFAULT_ACHIEVEMENT_UNLOCKER_STATE,
  setActiveAccount: key => {
    const { entries } = get()
    const entry = entries[key] ?? DEFAULT_ACHIEVEMENT_UNLOCKER_STATE
    set({
      accountKey: key,
      entries: entries[key] ? entries : { ...entries, [key]: entry },
      state: entry,
    })
  },
  updateState: (key, state) => {
    const current = get()
    set({
      entries: { ...current.entries, [key]: state },
      ...(current.accountKey === key ? { state } : {}),
    })
  },
  clearEntry: key => {
    const current = get()
    const entries = { ...current.entries }
    delete entries[key]
    set(
      current.accountKey === key
        ? { entries, accountKey: null, state: DEFAULT_ACHIEVEMENT_UNLOCKER_STATE }
        : { entries },
    )
  },
}))
