import { create } from 'zustand'
import { invoke } from '@/shared/utils/invoke'

// How long to collect cards rendering in the same pass before asking the backend about them all at
// once. Grids are virtualized, so this only ever covers the cards actually on screen.
const REQUEST_BATCH_DELAY_MS = 50

interface GameArtStore {
  // A portrait URL from the Steam store, `null` when there isn't one or the lookup failed, and
  // absent while the lookup hasn't finished.
  resolved: Record<number, string | null>
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

const queuedAppIds = new Set<number>()
const requestedAppIds = new Set<number>()
let flushTimeout: ReturnType<typeof setTimeout> | null = null

const flushQueue = async () => {
  flushTimeout = null
  const appIds = [...queuedAppIds]
  queuedAppIds.clear()

  let results: Record<number, string | null> = {}
  try {
    results = await invoke<Record<number, string | null>>('resolve_game_art', { appIds })
  } catch {
    // `invoke` already logged it. Every id below still resolves to `null`, so the cards move on to
    // their fallbacks rather than waiting on art that isn't coming.
  }

  useGameArtStore.setState(state => {
    const resolved = { ...state.resolved }
    for (const appId of appIds) resolved[appId] = results[appId] ?? null
    return { resolved }
  })
}

// Asks for a game's portrait URL once per session, however many cards show that game.
export const requestGameArt = (appId: number) => {
  if (requestedAppIds.has(appId)) return
  requestedAppIds.add(appId)
  queuedAppIds.add(appId)
  flushTimeout ??= setTimeout(flushQueue, REQUEST_BATCH_DELAY_MS)
}
