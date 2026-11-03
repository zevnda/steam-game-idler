import { create } from 'zustand'

// Settings > Customization's game card style: tall cover-art cards (the default) or wide ones showing
// Steam's header art. Only the shape and art differ; both are the same `GamePosterCard`.
//
// Saved per device in localStorage, like the sort preferences, rather than in settings.json: it's a
// display preference with nothing on the Rust side that needs it, and reading it synchronously here
// means a grid never lays out in the wrong shape first while settings load.

export type GameCardStyle = 'cover' | 'banner'

const STORAGE_KEY = 'sgi-game-card-style'

// Height as a share of width, and the narrowest a card gets before the grid drops a column. The CSS
// side of these (`--game-card-*` in globals.css) must match, since skeletons and non-virtualized
// grids lay out from CSS while virtualized grids do the same maths in JS.
export const GAME_CARD_STYLE_METRICS: Record<
  GameCardStyle,
  { heightRatio: number; minCardWidth: number }
> = {
  cover: { heightRatio: 3 / 2, minCardWidth: 150 },
  banner: { heightRatio: 215 / 460, minCardWidth: 220 },
}

const readStored = () => {
  const stored = typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)
  return (stored === 'banner' ? 'banner' : 'cover') as GameCardStyle
}

// The CSS variables key off this attribute on <html>
const applyToDocument = (style: GameCardStyle) => {
  if (typeof document !== 'undefined') document.documentElement.dataset.gameCardStyle = style
}

interface GameCardStyleStore {
  style: GameCardStyle
  setStyle: (style: GameCardStyle) => void
}

export const useGameCardStyleStore = create<GameCardStyleStore>(set => ({
  style: readStored(),
  setStyle: style => {
    localStorage.setItem(STORAGE_KEY, style)
    applyToDocument(style)
    set({ style })
  },
}))

applyToDocument(useGameCardStyleStore.getState().style)

export const useGameCardMetrics = () =>
  GAME_CARD_STYLE_METRICS[useGameCardStyleStore(state => state.style)]
