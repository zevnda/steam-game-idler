import type { IconType } from 'react-icons'
import { create } from 'zustand'

// One entry in the app's right-click menu (ContextMenu.tsx). Plain data, so whatever builds a menu
// (useContextMenu.ts, buildGameCardMenu.ts) never touches the component.
export type ContextMenuEntry =
  | {
      kind: 'item'
      id: string
      label: string
      icon?: IconType
      isDisabled?: boolean
      onAction: () => unknown
    }
  | { kind: 'separator'; id: string }
  | { kind: 'submenu'; id: string; label: string; icon?: IconType; items: ContextMenuEntry[] }

interface OpenContextMenu {
  // Viewport coordinates the menu opens from
  x: number
  y: number
  entries: ContextMenuEntry[]
  // Bumped on every open, so right-clicking somewhere else while a menu is showing remounts it at
  // the new position rather than moving the old one
  key: number
}

interface ContextMenuStore {
  menu: OpenContextMenu | null
  open: (x: number, y: number, entries: ContextMenuEntry[]) => void
  close: () => void
}

let nextKey = 0

export const useContextMenuStore = create<ContextMenuStore>(set => ({
  menu: null,
  open: (x, y, entries) => set({ menu: { x, y, entries, key: ++nextKey } }),
  close: () => set({ menu: null }),
}))
