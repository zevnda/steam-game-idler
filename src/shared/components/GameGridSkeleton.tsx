import { useLayoutEffect, useRef, useState } from 'react'
import { Skeleton } from '@heroui/react'
import {
  GAME_GRID_GAP,
  GAME_GRID_SCROLLBAR_WIDTH,
  useResponsiveColumnCount,
} from '@/shared/hooks/useGameGridColumns'
import { useGameCardMetrics } from '@/shared/stores/gameCardStyleStore'

// Shared loading placeholder for the app's game grids (games list, free games, and the browse +
// queue/list tabs of card farming, achievement unlocker, favorites and automatic idler). The
// Idling page keeps its own exact-count tiles instead, since it already knows how many games are
// idling. The Inventory Manager has its own, InventorySkeleton, since its page has a
// filter rail and its cards aren't plain tiles.
//
// Always whole rows, enough to fill the space it's given (a partly visible last row is clipped).
// A fixed tile count looked complete at some window widths and left a stub of a last row at
// others, depending on how many columns fit. The column count comes from the same function the
// real grids use, which reproduces `.game-grid`'s `auto-fill` exactly, so the skeleton and the
// content that replaces it agree.
//
// Sized to end exactly at the bottom of whatever scrolls it (its nearest scrollable ancestor, or
// the window if there's none), measured from its own top edge - never taller. Several pages
// render it straight inside a scrolling tab panel; a skeleton taller than that panel made the
// panel scroll, and the scrollbar that appeared then stole width from the column count, so the
// skeleton showed fewer, bigger tiles than the grid that replaced it. Measuring the space rather
// than relying on `flex-1` also covers hosts that aren't flex columns (Card Farming's tab panels),
// where this box would otherwise only be as tall as its own tiles and the row count would feed
// back on itself. Excess tiles are clipped (`overflow-hidden`), never scrolled into.
//
// The real grids leave a scrollbar-wide strip on the right; this leaves the same strip as plain
// extra right padding (GAME_GRID_SCROLLBAR_WIDTH), not `scrollbar-gutter`, so the width the column
// count is worked out from and the width CSS lays the tiles out in are the same width. With
// `scrollbar-gutter`, the measured width already excluded the gutter and the column math
// (which subtracts the scrollbar itself) took it off twice - counting one column fewer than CSS
// laid out, so the last row came up short of tiles. The `game-grid-skeleton`
// marker stops the hosting panel reserving scrollbar room on top (see globals.css's
// `main .overflow-y-auto` rule), which would make CSS lose a column the count doesn't.
const findScrollParent = (el: HTMLElement) => {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
  }
  return null
}

export const GameGridSkeleton = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { usableWidth, columnCount } = useResponsiveColumnCount(containerRef)
  const { heightRatio } = useGameCardMetrics()
  const [availableHeight, setAvailableHeight] = useState(0)

  // A layout effect so the first paint already has the right height (no one-frame scrollbar).
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const scrollParent = findScrollParent(el)
    const measure = () => {
      const top = el.getBoundingClientRect().top
      const bottom = scrollParent
        ? scrollParent.getBoundingClientRect().bottom -
          parseFloat(getComputedStyle(scrollParent).paddingBottom)
        : window.innerHeight
      setAvailableHeight(Math.max(0, Math.floor(bottom - top)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const tileWidth = (usableWidth - GAME_GRID_GAP * (columnCount - 1)) / columnCount
  const rowHeight = tileWidth * heightRatio + GAME_GRID_GAP
  // Nothing until the box has been measured - also covers the static export build, which renders
  // this with no `window`
  const rowCount =
    usableWidth > 0 && availableHeight > 0 ? Math.ceil(availableHeight / rowHeight) : 0

  return (
    <div
      ref={containerRef}
      className='game-grid-skeleton min-h-0 shrink-0 overflow-hidden'
      style={{ height: availableHeight || undefined }}
    >
      <div
        className='game-grid page-content'
        style={{ paddingRight: `calc(1.5rem + ${GAME_GRID_SCROLLBAR_WIDTH}px)` }}
      >
        {Array.from({ length: columnCount * rowCount }, (_, index) => (
          <Skeleton key={index} className='aspect-(--game-card-aspect) rounded-xl' />
        ))}
      </div>
    </div>
  )
}
