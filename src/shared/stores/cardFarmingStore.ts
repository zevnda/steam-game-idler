import type { FarmingState } from '@/features/card-farming/types'
import type { AccountKey } from './sessionStore'
import { create } from 'zustand'
import { DEFAULT_FARMING_STATE } from '@/features/card-farming/types'

interface CardFarmingStore {
  // Which entry the denormalized `state` below currently mirrors - mirrors gamesListStore's/
  // idlingStore's accountKey/entries split exactly (see their doc comments for the full reasoning,
  // not repeated here).
  accountKey: AccountKey | null
  // Unlike idlingStore's entries, an entry here is just `FarmingState` verbatim - the backend
  // already reports everything (`initialRemaining`/`remaining` per game), so there's no
  // frontend-only bookkeeping to derive per account the way idling's start timestamps needed.
  entries: Record<AccountKey, FarmingState>
  // Denormalized view of entries[accountKey] - this is the shape Sidebar/useCardFarming already
  // read and doesn't change.
  state: FarmingState
  // Per-account "has the user already dismissed this cycle's finished summary" flag. Lives here
  // (not CardFarmingPage's own component state) for the same reason `entries` does - a page remount
  // (navigate away from card-farming and back) must not resurrect a summary the user already
  // dismissed, since the backend's own `completed` list keeps reporting the last cycle's result
  // until a new one starts (see `FarmingState`'s doc comment). Reset to false in `updateState`
  // whenever a fresh `isFarming: true` update arrives for that account, so a new cycle re-arms the
  // summary for its own eventual result.
  dismissedFinished: Record<AccountKey, boolean>
  // Denormalized view of dismissedFinished[accountKey], mirroring `state` above.
  dismissedFinishedForActive: boolean
  // Makes `key` the active account, seeding a default entry the first time it's seen and pointing
  // the denormalized view at whatever it already has cached otherwise - never touches any other
  // account's entry. Called from useCardFarmingSync only, same as gamesListStore/idlingStore.
  setActiveAccount: (key: AccountKey) => void
  // Replaces `key`'s tracked state. Updates the denormalized view too iff `key` is still active by
  // the time this resolves - replaces the old bare `setState` call sites.
  updateState: (key: AccountKey, state: FarmingState) => void
  // Marks `key`'s current finished summary as dismissed - called from CardFarmingPage's "Done"
  // button.
  dismissFinished: (key: AccountKey) => void
  // Drops one account's entry entirely (sign-out) - mirrors gamesListStore's/idlingStore's clearEntry.
  clearEntry: (key: AccountKey) => void
}

// Mirrors `idlingStore`'s reasoning exactly: lives here (not in the card-farming page's own
// component state) so a running farming cycle's progress survives navigating away from
// /dashboard/card-farming and back - `useCardFarmingSync` is mounted once from `DashboardShell`,
// which is never unmounted by route changes within /dashboard/*. Account-keyed the same way
// gamesListStore/idlingStore already are so a backgrounded account's farming progress stays
// correct once the account
// switcher lands, instead of one account's events clobbering another's view.
export const useCardFarmingStore = create<CardFarmingStore>((set, get) => ({
  accountKey: null,
  entries: {},
  state: DEFAULT_FARMING_STATE,
  dismissedFinished: {},
  dismissedFinishedForActive: false,
  setActiveAccount: key => {
    const { entries, dismissedFinished } = get()
    const entry = entries[key] ?? DEFAULT_FARMING_STATE
    set({
      accountKey: key,
      entries: entries[key] ? entries : { ...entries, [key]: entry },
      state: entry,
      dismissedFinishedForActive: dismissedFinished[key] ?? false,
    })
  },
  updateState: (key, state) => {
    const current = get()
    const dismissedFinished = state.isFarming
      ? { ...current.dismissedFinished, [key]: false }
      : current.dismissedFinished
    set({
      entries: { ...current.entries, [key]: state },
      dismissedFinished,
      ...(current.accountKey === key
        ? { state, dismissedFinishedForActive: dismissedFinished[key] ?? false }
        : {}),
    })
  },
  dismissFinished: key => {
    const current = get()
    const dismissedFinished = { ...current.dismissedFinished, [key]: true }
    set({
      dismissedFinished,
      ...(current.accountKey === key ? { dismissedFinishedForActive: true } : {}),
    })
  },
  clearEntry: key => {
    const current = get()
    const entries = { ...current.entries }
    delete entries[key]
    const dismissedFinished = { ...current.dismissedFinished }
    delete dismissedFinished[key]
    set(
      current.accountKey === key
        ? {
            entries,
            dismissedFinished,
            accountKey: null,
            state: DEFAULT_FARMING_STATE,
            dismissedFinishedForActive: false,
          }
        : { entries, dismissedFinished },
    )
  },
}))
