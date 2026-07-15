import type { OwnedGame } from '@/features/games-list/types'
import type { AccountKey } from './sessionStore'
import { create } from 'zustand'

type Phase = 'loading' | 'ready'

export interface GamesListEntry {
  phase: Phase
  games: OwnedGame[]
  isRefreshing: boolean
  errorCode: string | null
  lastFetchedAt: number | null
  // Only ever true for a CLI-mode account - mirrors `get_owned_games`'s `possiblyPrivate` (see
  // src-tauri/src/games/mod.rs::OwnedGamesResult). Agent-mode accounts never depend on the Steam
  // Web API for completeness, so this stays false for them regardless of privacy settings.
  possiblyPrivate: boolean
}

const EMPTY_ENTRY: GamesListEntry = {
  phase: 'loading',
  games: [],
  isRefreshing: false,
  errorCode: null,
  lastFetchedAt: null,
  possiblyPrivate: false,
}

interface GamesListStore {
  // Which entry the denormalized phase/games/etc below currently mirror.
  accountKey: AccountKey | null
  // Per-account cache - unlike sessionStore's `accounts` (still groundwork for a flow that doesn't
  // exist yet), this one is exercised the moment two accounts are ever made active in the same
  // session: it's what lets switching the active account restore a previously-fetched account's
  // games instantly instead of discarding
  // them and refetching every time.
  entries: Record<AccountKey, GamesListEntry>
  // Denormalized view of entries[accountKey], kept in sync by setActiveAccount/updateEntry below -
  // this is the shape `useGamesList` and both consuming pages already read and doesn't change.
  phase: Phase
  games: OwnedGame[]
  isRefreshing: boolean
  errorCode: string | null
  lastFetchedAt: number | null
  possiblyPrivate: boolean
  // Makes `key` the active account, seeding an empty "loading" entry the first time it's seen, and
  // pointing the denormalized view at whatever it already has cached otherwise - never touches any
  // other account's entry.
  setActiveAccount: (key: AccountKey) => void
  // Merges `patch` into `key`'s entry, and into the denormalized view too if `key` is still active
  // by the time this resolves - replaces the old per-call-site `accountKey === key` guards that
  // protected against a stale in-flight fetch for a since-replaced account clobbering the wrong one.
  updateEntry: (key: AccountKey, patch: Partial<GamesListEntry>) => void
  // Drops one account's entry entirely (sign-out) - mirrors sessionStore's clearAccount shape.
  clearEntry: (key: AccountKey) => void
}

// Holds the fetched owned-games list per signed-in account, populated by `useGamesListSync`
// (mounted once in `DashboardShell`, never unmounted by route changes within /dashboard/*) rather
// than by each page's own local state - mirrors `idlingStore`'s reasoning exactly: without this,
// navigating away from /dashboard and back remounted `GamesPage` and refetched from scratch every
// time. Read by both `games-list`'s `GamesPage` and `idling`'s `IdlingPage` (both already reused
// one `useGamesList` hook before this store existed - see that hook's own doc comment).
export const useGamesListStore = create<GamesListStore>((set, get) => ({
  accountKey: null,
  entries: {},
  phase: 'loading',
  games: [],
  isRefreshing: false,
  errorCode: null,
  lastFetchedAt: null,
  possiblyPrivate: false,
  setActiveAccount: key => {
    const { entries } = get()
    const entry = entries[key] ?? EMPTY_ENTRY
    set({
      accountKey: key,
      entries: entries[key] ? entries : { ...entries, [key]: entry },
      ...entry,
    })
  },
  updateEntry: (key, patch) => {
    const state = get()
    const entry = { ...(state.entries[key] ?? EMPTY_ENTRY), ...patch }
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
