import type { SelectableGame } from '@/shared/hooks/useCardSelection'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { CellComponentProps } from 'react-window'
import type { AchievementUnlockerEntry } from '../types'
import { useRef, useState } from 'react'
import { Grid } from 'react-window'
import { AchievementUnlockerListCard } from './AchievementUnlockerListCard'
import { SortableAchievementUnlockerListCard } from './SortableAchievementUnlockerListCard'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'
import {
  GAME_GRID_GAP as GAP,
  GAME_CARD_INFO_HEIGHT as INFO_HEIGHT,
  GAME_CARD_THUMBNAIL_ASPECT as THUMBNAIL_ASPECT,
  useResponsiveColumnCount,
} from '@/shared/hooks/useGameGridColumns'
import { useSelectableGames } from '@/shared/hooks/useSelectableGames'

// See VirtualizedGameGrid.tsx's top comment for why horizontal padding is a spacer column instead
// of CSS padding on the Grid itself.
const PADDING = 24

interface AchievementUnlockerListGridProps {
  queue: AchievementUnlockerEntry[]
  pendingAppIds: Set<number>
  onRemove: (appId: number) => void
  onReorder: (newOrder: AchievementUnlockerEntry[]) => void
  onEditOrder: (game: AchievementUnlockerEntry) => void
}

interface CellProps {
  queue: AchievementUnlockerEntry[]
  selectableGames: SelectableGame[]
  realColumnCount: number
  cardWidth: number
  cardHeight: number
  activeId: number | null
  pendingAppIds: Set<number>
  onRemove: (appId: number) => void
  onEditOrder: (game: AchievementUnlockerEntry) => void
}

// Every card - including the last in a row/column - renders at this fixed `cardWidth`/`cardHeight`.
// No per-cell shrinking needed here: `columnWidth`/`rowHeight` below already allocate each *slot* as
// card+trailing-gap (or just card, for the last row/column) - see VirtualizedGameGrid.tsx's
// `cardWidth` comment for why that split has to happen there and not here.
const Cell = ({
  ariaAttributes,
  columnIndex,
  rowIndex,
  style,
  queue,
  selectableGames,
  realColumnCount,
  cardWidth,
  cardHeight,
  activeId,
  pendingAppIds,
  onRemove,
  onEditOrder,
}: CellComponentProps<CellProps>) => {
  // Column 0 and the last column are PADDING-wide spacers, not real cards - see this file's top
  // comment / VirtualizedGameGrid.tsx.
  if (columnIndex === 0 || columnIndex === realColumnCount + 1) return null
  const game = queue[rowIndex * realColumnCount + (columnIndex - 1)]
  if (!game) return null
  return (
    <div {...ariaAttributes} style={{ ...style, width: cardWidth, height: cardHeight }}>
      {/* Keyed by appId, not just positioned by react-window's own rowIndex:columnIndex key on
          this Cell - react-window recycles a Cell's DOM node across renders of the same grid slot,
          so without this key a reorder would leave the *same* SortableAchievementUnlockerListCard
          instance (and its useSortable hook) silently rebound to a different item's id with no
          remount, which briefly renders with the FLIP transform meant for the old item and reads as
          a snap-back-then-correct glitch right after dropping. */}
      <SortableAchievementUnlockerListCard
        key={game.appId}
        game={game}
        isDragging={activeId === game.appId}
        isPending={pendingAppIds.has(game.appId)}
        orderedGames={selectableGames}
        onEditOrder={() => onEditOrder(game)}
        onRemove={() => onRemove(game.appId)}
      />
    </div>
  )
}

// Virtualized replacement for the previous plain `.map()` grid - "Add all to queue"
// (AchievementUnlockerPage.tsx) can now push the queue into the hundreds/thousands, so mounting
// every card at once is no longer safe to assume. Mirrors VirtualizedGameGrid.tsx's Grid/Cell/
// spacer-column mechanics (see that file for the padding/gap reasoning) combined with @dnd-kit
// sortable per AchievementOrderList.tsx's precedent for pairing react-window virtualization with
// drag-reorder: only the currently mounted (visible) cards are real drop targets at any moment, and
// dragging near either edge auto-scrolls the Grid's own scrollable root (dnd-kit's default
// PointerSensor autoscroll target) to bring the next rows into range - both are dnd-kit's own
// documented tradeoff, already accepted for AchievementOrderList. `DndContext`/`SortableContext` are
// owned here (not by the caller) since, unlike AchievementOrderOverlay/AchievementOrderList, nothing
// else outside this component needs to observe the drag.
//
// FavoritesListGrid/CardFarmingListGrid/AutoIdleListGrid keep the old non-virtualized shape - none
// of them has a bulk-add entry point (yet), so their queues stay genuinely small/bounded.
export const AchievementUnlockerListGrid = ({
  queue,
  pendingAppIds,
  onRemove,
  onReorder,
  onEditOrder,
}: AchievementUnlockerListGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const activeItem = queue.find(item => item.appId === activeId) ?? null
  const selectableGames = useSelectableGames(queue)
  const {
    width,
    usableWidth,
    columnCount: realColumnCount,
  } = useResponsiveColumnCount(containerRef)
  // See VirtualizedGameGrid.tsx's matching comment: `usableWidth` fits N cards plus the (N-1) gaps
  // *between* them, not N gaps (a trailing gap for every column, including the last, which has
  // nothing to gap against).
  const cardWidth = (usableWidth - GAP * (realColumnCount - 1)) / realColumnCount
  const cardHeight = Math.round(cardWidth * THUMBNAIL_ASPECT) + INFO_HEIGHT
  const rowCount = Math.ceil(queue.length / realColumnCount)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex(item => item.appId === active.id)
      const newIndex = queue.findIndex(item => item.appId === over.id)
      onReorder(arrayMove(queue, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <SortableContext items={queue.map(item => item.appId)}>
        {/* No horizontal padding here (or on Grid) - see VirtualizedGameGrid.tsx's top comment. */}
        <div ref={containerRef} className='h-full w-full'>
          {width > 0 && (
            <Grid
              cellComponent={Cell}
              cellProps={{
                queue,
                selectableGames,
                realColumnCount,
                cardWidth,
                cardHeight,
                activeId,
                pendingAppIds,
                onRemove,
                onEditOrder,
              }}
              className='py-6'
              columnCount={realColumnCount + 2}
              // Every real column's slot is `cardWidth` plus a trailing GAP to the next card -
              // except the last real column, which has no next card to gap against - see
              // VirtualizedGameGrid.tsx's matching comment for why.
              columnWidth={index => {
                if (index === 0 || index === realColumnCount + 1) return PADDING
                if (index === realColumnCount) return cardWidth
                return cardWidth + GAP
              }}
              rowCount={rowCount}
              // The last row gets `cardHeight` alone (no trailing GAP) - see
              // VirtualizedGameGrid.tsx's matching comment for why.
              rowHeight={index => (index === rowCount - 1 ? cardHeight : cardHeight + GAP)}
              style={{ height: '100%', width: '100%' }}
            />
          )}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <AchievementUnlockerListCard
            game={activeItem}
            onEditOrder={() => {}}
            onRemove={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
