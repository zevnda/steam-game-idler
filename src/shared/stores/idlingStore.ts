import type { AccountKey } from './sessionStore'
import { create } from 'zustand'

interface IdlingEntry {
  appIds: number[]
  startTimes: Record<number, number>
  // Owner name (see src-tauri/src/idling/claims.rs's OWNER_* constants) -> that owner's claimed
  // app ids for this account - lets the Idling page group games by originating feature. Kept
  // alongside appIds rather than derived from it since it comes from a separate backend command
  // (get_idle_claims) - see useIdlingSync's doc comment for why.
  claimsByOwner: Record<string, number[]>
}

const EMPTY_ENTRY: IdlingEntry = { appIds: [], startTimes: {}, claimsByOwner: {} }

interface IdlingStore {
  // Which entry the denormalized appIds/startTimes below currently mirror - mirrors
  // gamesListStore's accountKey/entries split exactly (see its doc comments for the full
  // reasoning, not repeated here).
  accountKey: AccountKey | null
  entries: Record<AccountKey, IdlingEntry>
  // Denormalized view of entries[accountKey] - this is the shape useIdling/Sidebar already read
  // and doesn't change.
  appIds: number[]
  startTimes: Record<number, number>
  claimsByOwner: Record<string, number[]>
  // Makes `key` the active account, seeding an empty entry the first time it's seen and pointing
  // the denormalized view at whatever it already has cached otherwise - never touches any other
  // account's entry. Called from useIdlingSync only, same as gamesListStore's setActiveAccount.
  setActiveAccount: (key: AccountKey) => void
  // Replaces `key`'s tracked app ids, deriving each id's elapsed-time start timestamp from that
  // same entry's previous startTimes (not the denormalized view) so a background account's start
  // timestamps keep advancing correctly even while a different account is active. Updates the
  // denormalized view too if `key` is still active by the time this resolves.
  setAppIds: (key: AccountKey, appIds: number[]) => void
  // Replaces `key`'s owner-claims breakdown wholesale - fetched separately from appIds (see
  // useIdlingSync), so it has its own setter rather than being folded into setAppIds.
  setClaimsByOwner: (key: AccountKey, claimsByOwner: Record<string, number[]>) => void
  // Drops one account's entry entirely (sign-out) - mirrors gamesListStore's clearEntry.
  clearEntry: (key: AccountKey) => void
}

// Tracks which app ids are currently idling per signed-in account, plus a frontend-only per-game
// start timestamp for the elapsed-time badge - neither backend reports one (see
// src-tauri/src/idling/mod.rs's IdleSetResult). Lives here rather than in the idling page's
// component state so elapsed timers survive navigating away from /dashboard/idling and back:
// `useIdlingSync` is mounted once from `DashboardShell`, which is never unmounted by route changes
// within /dashboard/*, so this store keeps updating in the background regardless of which route is
// actually showing.
export const useIdlingStore = create<IdlingStore>((set, get) => ({
  accountKey: null,
  entries: {},
  appIds: [],
  startTimes: {},
  claimsByOwner: {},
  setActiveAccount: key => {
    const { entries } = get()
    const entry = entries[key] ?? EMPTY_ENTRY
    set({
      accountKey: key,
      entries: entries[key] ? entries : { ...entries, [key]: entry },
      ...entry,
    })
  },
  setAppIds: (key, appIds) => {
    const state = get()
    const prevEntry = state.entries[key]
    const prevStartTimes = prevEntry?.startTimes ?? {}
    const now = Date.now()
    const startTimes: Record<number, number> = {}
    for (const appId of appIds) {
      startTimes[appId] = prevStartTimes[appId] ?? now
    }
    const entry: IdlingEntry = {
      appIds,
      startTimes,
      claimsByOwner: prevEntry?.claimsByOwner ?? {},
    }
    set({
      entries: { ...state.entries, [key]: entry },
      ...(state.accountKey === key ? entry : {}),
    })
  },
  setClaimsByOwner: (key, claimsByOwner) => {
    const state = get()
    const prevEntry = state.entries[key] ?? EMPTY_ENTRY
    const entry: IdlingEntry = { ...prevEntry, claimsByOwner }
    set({
      entries: { ...state.entries, [key]: entry },
      ...(state.accountKey === key ? entry : {}),
    })
  },
  clearEntry: key => {
    const state = get()
    const entries = { ...state.entries }
    delete entries[key]
    set(state.accountKey === key ? { entries, accountKey: null, ...EMPTY_ENTRY } : { entries })
  },
}))
