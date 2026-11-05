import { useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useGameCardMetrics } from '@/shared/stores/gameCardStyleStore'

// Shared sizing constants for every OwnedGame/GameWithDrops grid card in this rewrite - kept in one
// place so VirtualizedGameGrid (idling/favorites/full-library grids) and GamesList's carousel-aware
// row list (games-list's own page) size their plain (non-carousel) cards identically.
export const GAME_GRID_GAP = 16
export const GAME_GRID_PADDING = 24
// Must match theme.css's `--scrollbar-size` exactly - see VirtualizedGameGrid's
// original doc comment for why this can't just be react-window's own `getScrollbarSize()`.
export const GAME_GRID_SCROLLBAR_WIDTH = 14
// A card's height ratio and minimum width come from `useGameCardMetrics` (gameCardStyleStore.ts), and
// must match `.game-grid`'s minimum column width in globals.css, which lays out the non-virtualized
// grids and every loading skeleton. Column counts are worked out the same way as CSS `auto-fill` for
// the same reason, so a grid doesn't change column count when its skeleton swaps for real content.
// Cover cards' 150 fits 6 columns at the default 1300px window.
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
  // Not used for the column math - handed to react-window's Grid as `defaultHeight` (with `width`
  // as `defaultWidth`), see below.
  const [height, setHeight] = useState(0)
  const { minCardWidth } = useGameCardMetrics()

  // A layout effect, measured once up front, so the very first paint already has the real column
  // count. Waiting for ResizeObserver's first callback drew one frame at `min` columns (the grid at
  // about half its width), then snapped to the real layout - a visible flicker on every navigation
  // between two pages that both show a game grid.
  //
  // The height is measured alongside so callers can pass both to react-window's Grid as
  // `defaultWidth`/`defaultHeight`. The Grid measures its own viewport only after its first paint
  // and, until then, draws just the cells it assumes are visible: one frame with a few columns of
  // cards and the rest of the grid empty.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setWidth(rect.width)
    setHeight(rect.height)
    const observer = new ResizeObserver(([entry]) => {
      flushSync(() => {
        setWidth(entry.contentRect.width)
        setHeight(entry.contentRect.height)
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  const usableWidth = Math.max(0, width - GAME_GRID_PADDING * 2 - GAME_GRID_SCROLLBAR_WIDTH)
  const fittedColumns = targetCardWidth
    ? Math.round(usableWidth / targetCardWidth)
    : Math.floor((usableWidth + GAME_GRID_GAP) / (minCardWidth + GAME_GRID_GAP))
  const columnCount = usableWidth ? Math.min(max, Math.max(min, fittedColumns)) : min

  return { width, height, usableWidth, columnCount }
}
