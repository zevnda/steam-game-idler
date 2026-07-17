import { create } from 'zustand'

// Shared shape for "the ordered list of cards a card is currently rendered from" - resolve
// nullable display names once per page (e.g. via `useMemo`) rather than inside every card, since a
// virtualized grid re-renders many cards per scroll and a per-card name-fallback map would be
// wasted O(n) work repeated for every visible card. Re-exported by `useCardSelection.ts`, the
// primary place feature code imports it from.
export interface SelectableGame {
  appId: number
  name: string
}

interface GameSelectionStore {
  selected: Map<number, string>
  anchorAppId: number | null
  toggle: (appId: number, name: string) => void
  selectRange: (orderedGames: SelectableGame[], targetAppId: number) => void
  clear: () => void
}

// Backs Ctrl/Shift-click multi-select on game cards (games-list, favorites, auto-idle,
// achievement-unlocker, card-farming) so the right-click context menu can bulk "start/stop
// idling" and "add to lists" - see `useCardSelection.ts`/`buildGameCardMenu.ts`. Deliberately flat
// and unpersisted, unlike `idlingStore.ts`'s account-scoped shape - selection is a transient
// "what's currently on screen" UI concern, not something that should survive a reload or carry
// over across an account switch (see `useClearSelectionOnEscape.ts` and `DashboardShell.tsx`'s
// route/account-change clearing). `selected` keeps names alongside app ids so the context menu
// never needs an extra lookup to build its bulk `games[]` payload.
export const useGameSelectionStore = create<GameSelectionStore>((set, get) => ({
  selected: new Map(),
  anchorAppId: null,

  toggle: (appId, name) => {
    const next = new Map(get().selected)
    if (next.has(appId)) {
      next.delete(appId)
      set({ selected: next })
    } else {
      next.set(appId, name)
      set({ selected: next, anchorAppId: appId })
    }
  },

  // Standard file-explorer semantics: replaces the current selection with the inclusive range
  // between the last anchor and `targetAppId` within `orderedGames`. Falls back to selecting just
  // `targetAppId` if the anchor isn't present in this particular ordered list - e.g. it was set on
  // a different tab's card set.
  selectRange: (orderedGames, targetAppId) => {
    const { anchorAppId } = get()
    const anchorIndex =
      anchorAppId === null ? -1 : orderedGames.findIndex(g => g.appId === anchorAppId)
    const targetIndex = orderedGames.findIndex(g => g.appId === targetAppId)
    if (anchorIndex === -1 || targetIndex === -1) {
      const target = orderedGames[targetIndex]
      if (!target) return
      set({ selected: new Map([[target.appId, target.name]]), anchorAppId: target.appId })
      return
    }

    const [start, end] =
      anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex]
    const next = new Map<number, string>()
    for (const game of orderedGames.slice(start, end + 1)) {
      next.set(game.appId, game.name)
    }
    set({ selected: next })
  },

  clear: () => set({ selected: new Map(), anchorAppId: null }),
}))
