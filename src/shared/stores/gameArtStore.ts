import { create } from 'zustand'
import { invoke } from '@/shared/utils/invoke'

// How long to collect cards rendering in the same pass before asking the backend about them all at
// once. Grids are virtualized, so this only ever covers the cards actually on screen.
const REQUEST_BATCH_DELAY_MS = 50

// Mirrors `game_art.rs`'s `GameArt`.
export interface GameArt {
  portrait: string | null
  hero: string | null
}

const NO_ART: GameArt = { portrait: null, hero: null }

interface GameArtStore {
  // A game's art from the Steam store, with empty URLs when there's none or the lookup failed, and
  // absent while the lookup hasn't finished.
  resolved: Record<number, GameArt>
  // How far each game has fallen through `GamePosterArt`'s fallback chain after images failed to
  // load. Kept here rather than in the card so that scrolling a failed game out of a virtualized
  // grid and back doesn't replay every failing request and flash through each step again.
  fallbackSteps: Record<number, number>
  advanceFallback: (appId: number) => void
}

export const useGameArtStore = create<GameArtStore>(set => ({
  resolved: {},
  fallbackSteps: {},
  advanceFallback: appId =>
    set(state => ({
      fallbackSteps: { ...state.fallbackSteps, [appId]: (state.fallbackSteps[appId] ?? 0) + 1 },
    })),
}))

// Looks up a set of games directly, for a caller that needs the answer before it can continue.
export const fetchGameArt = async (appIds: number[]) => {
  let results: Record<number, GameArt> = {}
  try {
    results = await invoke<Record<number, GameArt>>('resolve_game_art', { appIds })
  } catch {
    // `invoke` already logged it. Every id below still gets an empty entry, so callers move on to
    // their fallbacks rather than waiting on art that isn't coming.
  }

  const merged = Object.fromEntries(appIds.map(appId => [appId, results[appId] ?? NO_ART]))
  useGameArtStore.setState(state => ({ resolved: { ...state.resolved, ...merged } }))
  return merged
}

const queuedAppIds = new Set<number>()
const requestedAppIds = new Set<number>()
let flushTimeout: ReturnType<typeof setTimeout> | null = null

const flushQueue = () => {
  flushTimeout = null
  const appIds = [...queuedAppIds]
  queuedAppIds.clear()
  void fetchGameArt(appIds)
}

// Asks for a game's art once per session, however many cards show that game.
export const requestGameArt = (appId: number) => {
  if (requestedAppIds.has(appId)) return
  requestedAppIds.add(appId)
  queuedAppIds.add(appId)
  flushTimeout ??= setTimeout(flushQueue, REQUEST_BATCH_DELAY_MS)
}
