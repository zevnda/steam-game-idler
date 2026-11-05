import { useRef } from 'react'
import { Skeleton } from '@heroui/react'
import { GAME_GRID_GAP, useResponsiveColumnCount } from '@/shared/hooks/useGameGridColumns'
import { useGameCardMetrics } from '@/shared/stores/gameCardStyleStore'

// Shared loading placeholder for the app's game grids (games list, free games, card farming's
// browse/queue tabs). The Inventory Manager has its own, InventorySkeleton, since its page has a
// filter rail and its cards aren't plain tiles.
//
// Always whole rows, enough to run past the bottom of the window (the extra row is clipped). A
// fixed tile count looked complete at some window widths and left a stub of a last row at others,
// depending on how many columns fit. The column count comes from the same function the real grids
// use, which reproduces `.game-grid`'s `auto-fill` exactly, so the skeleton and the content that
// replaces it agree. Rows are worked out from the window's height rather than this box's: in a
// host that isn't a flex column (Card Farming's tab panels), this box is only as tall as the
// tiles inside it, so sizing from it would feed back on itself.
//
// Wrapped in its own `overflow-hidden` box: `flex-1 min-h-0` sizes it to whatever space its flex-
// column parent has, and `max-h-screen` caps it in a host that isn't one. Either way, excess tiles
// are clipped, never scrolled into. `scrollbar-gutter` reserves the same scrollbar room the real
// grids have, which the column count allows for.
export const GameGridSkeleton = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { usableWidth, columnCount } = useResponsiveColumnCount(containerRef)
  const { heightRatio } = useGameCardMetrics()

  const tileWidth = (usableWidth - GAME_GRID_GAP * (columnCount - 1)) / columnCount
  const rowHeight = tileWidth * heightRatio + GAME_GRID_GAP
  // Nothing until the box has been measured - also covers the static export build, which renders
  // this with no `window`
  const rowCount = usableWidth > 0 ? Math.ceil(window.innerHeight / rowHeight) + 1 : 0

  return (
    <div
      ref={containerRef}
      className='max-h-screen min-h-0 flex-1 overflow-hidden scrollbar-gutter-stable'
    >
      <div className='game-grid page-content'>
        {Array.from({ length: columnCount * rowCount }, (_, index) => (
          <Skeleton key={index} className='aspect-(--game-card-aspect) rounded-xl' />
        ))}
      </div>
    </div>
  )
}
