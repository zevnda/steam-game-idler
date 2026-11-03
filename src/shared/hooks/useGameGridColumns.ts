import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

// Shared sizing constants for every OwnedGame/GameWithDrops grid card in this rewrite - kept in one
// place so VirtualizedGameGrid (idling/favorites/full-library grids) and GamesList's carousel-aware
// row list (games-list's own page) size their plain (non-carousel) cards identically.
export const GAME_GRID_GAP = 16
export const GAME_GRID_PADDING = 24
// Must match theme.css's `--scrollbar-size` exactly - see VirtualizedGameGrid's
// original doc comment for why this can't just be react-window's own `getScrollbarSize()`.
export const GAME_GRID_SCROLLBAR_WIDTH = 14
// Portrait 2:3 art filling the whole card - must match `GamePosterCard`'s `aspect-2/3`.
export const GAME_CARD_HEIGHT_RATIO = 3 / 2
// Must match `.game-grid`'s minimum column width in globals.css, which lays out the non-virtualized
// grids and every loading skeleton. Column counts are worked out the same way as CSS `auto-fill` for
// the same reason, so a grid doesn't change column count when its skeleton swaps for real content.
// 150 fits 6 columns at the default 1300px window, with another column about every 166px after that.
export const GAME_GRID_MIN_CARD_WIDTH = 150
export const GAME_GRID_MIN_COLUMNS = 2

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
    // Uncapped by default, so an ultrawide monitor gets more columns rather than ever-larger cards,
    // and because `.game-grid`'s `auto-fill` has no cap either, so one here would make the skeletons
    // and non-virtualized grids disagree with the virtualized ones on a wide window.
    max = Number.POSITIVE_INFINITY,
    targetCardWidth,
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
  const fittedColumns = targetCardWidth
    ? Math.round(usableWidth / targetCardWidth)
    : Math.floor((usableWidth + GAME_GRID_GAP) / (GAME_GRID_MIN_CARD_WIDTH + GAME_GRID_GAP))
  const columnCount = usableWidth ? Math.min(max, Math.max(min, fittedColumns)) : min

  return { width, usableWidth, columnCount }
}
