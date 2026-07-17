import type { FreeGameEntry } from '@/features/free-games/types'
import { create } from 'zustand'

type Phase = 'loading' | 'ready'

interface FreeGamesStore {
  phase: Phase
  games: FreeGameEntry[]
  // Drives FreeGamesPageHeader's refresh-button spinner for a manual refresh only - never touched
  // by the hourly background poll (see `silentlyRefreshFreeGames` in useFreeGamesWatcher.ts),
  // mirroring gamesListStore's identical isRefreshing/silent-refresh split.
  isRefreshing: boolean
  errorCode: string | null
  lastFetchedAt: number | null
  setGames: (games: FreeGameEntry[]) => void
  // Used by the hourly background poll only - updates the list without touching phase/isRefreshing
  // at all, so it can never flip a concurrently in-flight manual refresh's button spinner off early
  // or re-trigger the page's (already long past) initial loading state. Mirrors
  // `silentlyRefreshGamesList`'s identical restraint.
  setGamesSilently: (games: FreeGameEntry[]) => void
  setLoading: () => void
  setError: (errorCode: string) => void
  removeGame: (appId: number) => void
}

// Discovery (get_free_games) is public, mode-agnostic data with no per-account meaning (see
// useFreeGamesWatcher's doc comment) - unlike gamesListStore/idlingStore/cardFarmingStore, this
// isn't account-keyed, just one flat entry. Populated by `useFreeGamesWatcher` (mounted once in
// `DashboardShell`, fetches once the owned-games list has loaded and hourly thereafter - see that
// hook's own doc comment for why it waits) rather than by `FreeGamesPage` itself, so the discovery
// list is already sitting here - fetched during the same window the app is settling in right after
// sign-in - by the time the user ever navigates to the
// page, instead of every page visit re-fetching from scratch.
export const useFreeGamesStore = create<FreeGamesStore>(set => ({
  phase: 'loading',
  games: [],
  isRefreshing: false,
  errorCode: null,
  lastFetchedAt: null,
  setGames: games =>
    set({ games, phase: 'ready', lastFetchedAt: Date.now(), errorCode: null, isRefreshing: false }),
  setGamesSilently: games => set({ games, lastFetchedAt: Date.now() }),
  setLoading: () => set({ isRefreshing: true, errorCode: null }),
  setError: errorCode => set({ errorCode, phase: 'ready', isRefreshing: false }),
  removeGame: appId => set(state => ({ games: state.games.filter(game => game.appId !== appId) })),
}))
