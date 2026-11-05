import { useRef } from 'react'
import { FILTER_OPTION_COUNT, FILTER_PANEL_CLASSNAME } from './InventoryFilterPanel'
import { CARD_TARGET_WIDTH, ESTIMATED_CARD_HEIGHT, GAP, PADDING } from './InventoryItemGrid'
import { Skeleton } from '@heroui/react'
import {
  GAME_GRID_SCROLLBAR_WIDTH,
  useResponsiveColumnCount,
} from '@/shared/hooks/useGameGridColumns'

// Varied so the placeholder filter labels don't read as one repeated block
const FILTER_LABEL_WIDTHS = ['w-24', 'w-10', 'w-24', 'w-20', 'w-24', 'w-14', 'w-20', 'w-18', 'w-14']

// The loading state for InventoryManagerPage: the filter rail and a grid of item cards, each laid
// out like the real thing (InventoryFilterPanel, InventoryItemGrid, InventoryItemCard), so the page
// keeps its shape when the real content swaps in. Where the real components' sizes live in
// constants, they're imported rather than copied - keep the rest in step if a card's layout
// changes.
export const InventorySkeleton = () => (
  <div className='flex min-h-0 flex-1'>
    <div className={FILTER_PANEL_CLASSNAME}>
      {/* Search */}
      <Skeleton className='h-10 w-full rounded-full' />
      {/* "Sort by" and its dropdown */}
      <div className='flex flex-col gap-1.5'>
        <div className='flex h-4 items-center px-1'>
          <Skeleton className='h-2.5 w-14 rounded-full' />
        </div>
        <Skeleton className='h-10 w-full rounded-full' />
      </div>
      <div className='h-px bg-border' />
      {/* "Filter" and its rows */}
      <div className='flex flex-col gap-1'>
        <div className='flex h-4 items-center px-1'>
          <Skeleton className='h-2.5 w-12 rounded-full' />
        </div>
        {Array.from({ length: FILTER_OPTION_COUNT }, (_, index) => (
          <div key={index} className='flex items-center gap-2.5 px-2.5 py-2'>
            <Skeleton className='size-4 shrink-0 rounded-md' />
            <div className='flex h-5 items-center'>
              <Skeleton
                className={`h-3 rounded-full ${FILTER_LABEL_WIDTHS[index % FILTER_LABEL_WIDTHS.length]}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
    <ItemGridSkeleton />
  </div>
)

// Same column count and spacing as InventoryItemGrid. The real grid is react-window's, with each
// column a card plus a trailing GAP, then a PADDING spacer and the scrollbar on the right - which
// as CSS grid padding comes to PADDING + GAP + the scrollbar's width.
const ItemGridSkeleton = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { height, columnCount } = useResponsiveColumnCount(containerRef, {
    max: 10,
    targetCardWidth: CARD_TARGET_WIDTH,
  })
  // Enough rows to fill the visible height, plus one so the bottom edge is never empty
  const rowCount = Math.ceil(height / (ESTIMATED_CARD_HEIGHT + GAP)) + 1

  return (
    <div ref={containerRef} className='min-h-0 flex-1 overflow-hidden'>
      <div
        className='page-toolbar-offset grid pb-6'
        style={{
          gap: GAP,
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          paddingLeft: PADDING,
          paddingRight: PADDING + GAP + GAME_GRID_SCROLLBAR_WIDTH,
        }}
      >
        {height > 0 &&
          Array.from({ length: columnCount * rowCount }, (_, index) => (
            <ItemCardSkeleton key={index} />
          ))}
      </div>
    </div>
  )
}

// InventoryItemCard's layout, each line kept at the real element's height so the card is the same
// size: the checkbox/action row, the 96px image, name and game, the price field and list button,
// and "Fetch price".
const ItemCardSkeleton = () => (
  <div className='flex flex-col items-center rounded-xl border border-border bg-surface p-2'>
    <div className='mb-2 flex h-6 w-full items-center justify-between'>
      <Skeleton className='size-4 rounded-md' />
      <div className='flex items-center gap-2 pr-1'>
        <Skeleton className='size-4 rounded-md' />
        <Skeleton className='size-4 rounded-md' />
      </div>
    </div>
    <Skeleton className='size-24 rounded-xl' />
    <div className='mt-2 flex flex-col items-center gap-0.5'>
      <div className='flex h-4 items-center'>
        <Skeleton className='h-3 w-24 rounded-full' />
      </div>
      <div className='flex h-4 items-center'>
        <Skeleton className='h-3 w-28 rounded-full' />
      </div>
    </div>
    <div className='mt-2 flex items-center gap-1'>
      <Skeleton className='h-10 w-32 rounded-full' />
      <Skeleton className='size-10 rounded-full' />
    </div>
    <div className='mt-2 flex h-4 items-center'>
      <Skeleton className='h-3 w-20 rounded-full' />
    </div>
  </div>
)
