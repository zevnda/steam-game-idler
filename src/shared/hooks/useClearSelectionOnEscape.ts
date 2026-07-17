import { useEffect } from 'react'
import { useGameSelectionStore } from '@/shared/stores/gameSelectionStore'

// Kept separate from `useDashboardShortcuts.ts` rather than folded into it - that hook is
// deliberately Ctrl/Cmd-only, mirroring `main`'s curated shortcut set, and short-circuits
// immediately for any unmodified key. Same input-focus bail-out as that hook so Escape inside a
// text field isn't hijacked.
export const useClearSelectionOnEscape = () => {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return
      if (e.key !== 'Escape') return
      if (useGameSelectionStore.getState().selected.size === 0) return

      useGameSelectionStore.getState().clear()
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [])
}
