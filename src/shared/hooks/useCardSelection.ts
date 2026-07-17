import type { SelectableGame } from '@/shared/stores/gameSelectionStore'
import type { MouseEvent } from 'react'
import { useGameSelectionStore } from '@/shared/stores/gameSelectionStore'

export type { SelectableGame }

// Wires Ctrl/Shift-click multi-select into one game card's root element. `orderedGames` is the
// full array the card is currently rendered from (in display order) - needed for Shift-click range
// math, and its mere presence is also what opts a card into selection at all: pass `undefined` for
// a card that shouldn't participate (e.g. `GameCarousel` rows reusing `GameCard` outside the main
// grid) to get a no-op handler and `isSelected` permanently `false`.
//
// A plain (unmodified) click is deliberately left alone - no card has click-to-open behavior today,
// so there's nothing to preserve, but there's also no reason for every plain click to mutate
// selection state. Selection only changes via Ctrl-click, Shift-click, or Escape
// (`useClearSelectionOnEscape.ts`).
export function useCardSelection(appId: number, name: string, orderedGames?: SelectableGame[]) {
  const isSelected = useGameSelectionStore(state => state.selected.has(appId))

  const onMouseDown = (event: MouseEvent) => {
    if (!orderedGames || event.button !== 0) return
    // Don't hijack a click meant for an interactive control inside the card (idle/achievements
    // buttons, a favorite/queue toggle, Auto Idle's enable Switch, a remove button) - HeroUI's
    // `Switch`/`Checkbox` render as `label > input`, not a `button`, so this has to check for the
    // general interactive-element shape, not just `button`.
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('button, input, label, a[href]')
    ) {
      return
    }

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      useGameSelectionStore.getState().toggle(appId, name)
    } else if (event.shiftKey) {
      event.preventDefault()
      useGameSelectionStore.getState().selectRange(orderedGames, appId)
    }
  }

  return { isSelected, onMouseDown }
}
