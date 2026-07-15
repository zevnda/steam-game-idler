import { Skeleton } from '@heroui/react'

interface GameGridSkeletonProps {
  // 30 comfortably fills a full viewport height even at the widest (2xl, 6-column) breakpoint,
  // instead of the 6-12 tiles every one of these grids used to hardcode - which only filled a
  // couple of rows and left the rest of the loading page looking sparse/empty.
  count?: number
  tileClassName?: string
  gridClassName?: string
}

const DEFAULT_GRID_CLASSNAME =
  'grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
const DEFAULT_TILE_CLASSNAME = 'aspect-460/215 rounded-lg'

// Shared loading placeholder for every game/item grid in the app (games list, free games,
// card farming's browse/queue tabs, inventory manager) - was five copies of the same
// `Array.from({length: N}).map(...)` block with a slightly different tile/grid class each time.
//
// Wrapped in its own `overflow-hidden` box, capped at `max-h-screen` - `count`'s tile total is
// tuned to fill a full viewport at the widest breakpoint, but at narrower breakpoints (fewer
// columns, so more rows for the same tile count) the grid's natural height can exceed the
// viewport, forcing the loading page itself to scroll. `flex-1 min-h-0` makes it size to whatever
// remaining space its flex-column parent actually has (matching every other branch these grids sit
// alongside - error/empty states, the real content grid); `max-h-screen` is the fallback cap for
// the one caller (CardFarmingPage's TabPanel) that isn't a flex container. Either way, excess
// tiles are clipped, never scrolled into.
export const GameGridSkeleton = ({
  count = 30,
  tileClassName = DEFAULT_TILE_CLASSNAME,
  gridClassName = DEFAULT_GRID_CLASSNAME,
}: GameGridSkeletonProps) => (
  <div className='max-h-screen min-h-0 flex-1 overflow-hidden'>
    <div className={gridClassName}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={tileClassName} />
      ))}
    </div>
  </div>
)
