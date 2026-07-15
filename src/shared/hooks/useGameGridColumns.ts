import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

// Shared sizing constants for every OwnedGame/GameWithDrops grid card in this rewrite - kept in one
// place so VirtualizedGameGrid (idling/favorites/full-library grids) and GamesList's carousel-aware
// row list (games-list's own page) size their plain (non-carousel) cards identically.
export const GAME_GRID_GAP = 16
export const GAME_GRID_PADDING = 24
// Must match theme.css's `::-webkit-scrollbar { width: 4px }` exactly - see VirtualizedGameGrid's
// original doc comment for why this can't just be react-window's own `getScrollbarSize()`.
export const GAME_GRID_SCROLLBAR_WIDTH = 4
export const GAME_CARD_THUMBNAIL_ASPECT = 215 / 460
export const GAME_CARD_INFO_HEIGHT = 44
export const GAME_GRID_TARGET_CARD_WIDTH = 220
export const GAME_GRID_MIN_COLUMNS = 2
export const GAME_GRID_MAX_COLUMNS = 8

interface ResponsiveColumnCountOptions {
  min?: number
  max?: number
  targetCardWidth?: number
}

// Measures a container's width and derives a responsive column count from it - shared by every
// game grid/list that lays cards out in columns. Column count is derived continuously from the
// container's actual measured pixel width, not a viewport-breakpoint table (see
// VirtualizedGameGrid's original doc comment for the sidebar-collapse case that motivated this).
// `flushSync`, not a plain state update - cell/row positions are derived from this state, not CSS,
// so an async-batched update would trail a mid-transition container resize (e.g. the sidebar's
// collapse animation) by a frame.
export function useResponsiveColumnCount(
  containerRef: React.RefObject<HTMLElement | null>,
  {
    min = GAME_GRID_MIN_COLUMNS,
    max = GAME_GRID_MAX_COLUMNS,
    targetCardWidth = GAME_GRID_TARGET_CARD_WIDTH,
  }: ResponsiveColumnCountOptions = {},
) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      flushSync(() => setWidth(entry.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  const usableWidth = Math.max(0, width - GAME_GRID_PADDING * 2 - GAME_GRID_SCROLLBAR_WIDTH)
  const columnCount = usableWidth
    ? Math.min(max, Math.max(min, Math.round(usableWidth / targetCardWidth)))
    : min

  return { width, usableWidth, columnCount }
}
