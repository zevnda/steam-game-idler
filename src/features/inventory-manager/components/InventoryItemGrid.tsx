import type { CellComponentProps } from 'react-window'
import type { InventoryItem } from '../types'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Grid, useGridCallbackRef } from 'react-window'
import { InventoryItemCard } from './InventoryItemCard'
import { EmptyState, Typography } from '@heroui/react'
import { BackToTopButton } from '@/shared/components/BackToTopButton'
import { useBackToTop } from '@/shared/hooks/useBackToTop'
import { useResponsiveColumnCount } from '@/shared/hooks/useGameGridColumns'

// Own copy of VirtualizedGameGrid's column-gap/padding constants and spacer-column padding trick
// (see that file's doc comment for why padding is baked into the grid's coordinate system instead
// of CSS padding) - not reused directly since that component is hard-typed to `OwnedGame[]` and
// sizes rows from a thumbnail aspect ratio, neither of which fits a fixed-content item card.
const GAP = 16
const PADDING = 24
// Widened from 190 (one fewer column per row at most container widths) to give the price
// NumberField's now-always-visible spin buttons (see InputField.tsx) room without the
// card feeling cramped.
const CARD_TARGET_WIDTH = 230
// One frame's fallback before the hidden measurer below reports the card's real rendered height -
// avoids a 0-height Grid flash on first paint. Not otherwise load-bearing.
const ESTIMATED_CARD_HEIGHT = 260

interface CardCallbacks {
  currency: string
  isLocked: (assetid: string) => boolean
  isSelected: (assetid: string) => boolean
  priceValueFor: (assetid: string) => number
  isFetchingPriceFor: (marketHashName: string) => boolean
  isListing: boolean
  isBusy: boolean
  onToggleLock: (assetid: string) => void
  onToggleSelect: (assetid: string) => void
  onPriceChange: (assetid: string, value: number) => void
  onListSingle: (item: InventoryItem) => void
  onOpenPriceModal: (item: InventoryItem) => void
}

interface InventoryItemGridProps extends CardCallbacks {
  items: InventoryItem[]
}

interface CellProps {
  items: InventoryItem[]
  realColumnCount: number
  rowCount: number
  cardWidth: number
  callbacks: CardCallbacks
}

const renderCard = (item: InventoryItem, callbacks: CardCallbacks) => (
  <InventoryItemCard
    currency={callbacks.currency}
    isFetchingPrice={callbacks.isFetchingPriceFor(item.marketHashName)}
    isListing={callbacks.isListing}
    isBusy={callbacks.isBusy}
    isLocked={callbacks.isLocked(item.assetid)}
    isSelected={callbacks.isSelected(item.assetid)}
    item={item}
    priceValue={callbacks.priceValueFor(item.assetid)}
    onListSingle={() => callbacks.onListSingle(item)}
    onOpenPriceModal={() => callbacks.onOpenPriceModal(item)}
    onPriceChange={value => callbacks.onPriceChange(item.assetid, value)}
    onToggleLock={() => callbacks.onToggleLock(item.assetid)}
    onToggleSelect={() => callbacks.onToggleSelect(item.assetid)}
  />
)

const Cell = ({
  ariaAttributes,
  columnIndex,
  rowIndex,
  style,
  items,
  realColumnCount,
  rowCount,
  cardWidth,
  callbacks,
}: CellComponentProps<CellProps>) => {
  // Column 0 and the last column are PADDING-wide spacers, not real cards - see this file's top
  // comment.
  if (columnIndex === 0 || columnIndex === realColumnCount + 1) return null
  const item = items[rowIndex * realColumnCount + (columnIndex - 1)]
  if (!item) return null
  const isLastRealColumn = columnIndex === realColumnCount
  const isLastRow = rowIndex === rowCount - 1
  const width = isLastRealColumn ? (style.width as number) : cardWidth
  const height = isLastRow ? (style.height as number) : (style.height as number) - GAP
  return (
    <div {...ariaAttributes} style={{ ...style, width, height }}>
      {renderCard(item, callbacks)}
    </div>
  )
}

// Virtualized replacement for the old fixed-54-per-page grid + pagination controls (see
// InventoryManagerPage/InventoryPageHeader) - an inventory can run into the hundreds/thousands of
// marketable items, the same "can realistically grow large" bar VirtualizedGameGrid was built for.
// Not built on VirtualizedGameGrid itself (hard-typed to `OwnedGame`,
// and its row height comes from a thumbnail aspect ratio that doesn't apply to this card's
// fixed-content layout) - instead measures one off-screen clone of the first item's card via
// ResizeObserver to get a real `rowHeight` that tracks whatever InventoryItemCard actually renders
// (badge line, locale-length changes, etc.) rather than a hardcoded guess.
export const InventoryItemGrid = ({ items, ...callbacks }: InventoryItemGridProps) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  // Callback-ref-backed state, not a plain `useRef` + mount-once effect - the measurer div only
  // exists while `items.length > 0` (see below), so its own ResizeObserver needs to reattach every
  // time that element is recreated, not just once. Same fix as containerRef staying permanently
  // mounted below, applied to this narrower case.
  const [measureEl, setMeasureEl] = useState<HTMLDivElement | null>(null)
  const [cardHeight, setCardHeight] = useState(ESTIMATED_CARD_HEIGHT)
  const [gridApi, setGridApi] = useGridCallbackRef()
  const { setScrollElement, isVisible, scrollToTop } = useBackToTop()
  useEffect(() => setScrollElement(gridApi?.element ?? null), [gridApi, setScrollElement])
  const {
    width,
    usableWidth,
    columnCount: realColumnCount,
  } = useResponsiveColumnCount(containerRef, { max: 10, targetCardWidth: CARD_TARGET_WIDTH })
  const cardColumnWidth = usableWidth / realColumnCount
  const cardWidth = cardColumnWidth - GAP
  const rowHeight = cardHeight + GAP
  const rowCount = Math.ceil(items.length / realColumnCount)

  useEffect(() => {
    if (!measureEl) return
    const observer = new ResizeObserver(([entry]) => setCardHeight(entry.contentRect.height))
    observer.observe(measureEl)
    return () => observer.disconnect()
  }, [measureEl])

  return (
    // Always mounted regardless of items.length, even for the empty-state branch below - unlike
    // measureEl, `useResponsiveColumnCount`'s ResizeObserver effect is keyed on the stable
    // `containerRef` object itself (see that hook), not the DOM node it points to, so it only ever
    // attaches once. Unmounting this div whenever a filter produced zero results (the previous
    // shape - an early return above this point) orphaned that observer permanently once the div
    // remounted with a filter change, freezing `width` forever and leaving the grid empty even
    // after items reappeared. No horizontal padding here (or on Grid) - see this file's top
    // comment. `h-full w-full` only, so react-window's own scrollbar sits flush against this
    // container's true edge.
    <div ref={containerRef} className='relative h-full w-full'>
      {items.length > 0 && (
        // Off-screen, inert clone of the first item's card, purely for the ResizeObserver above to
        // measure a real `rowHeight` from - never visible or interactive.
        <div
          ref={setMeasureEl}
          aria-hidden
          className='pointer-events-none invisible absolute top-0 left-0 -z-10'
          style={{ width: cardWidth > 0 ? cardWidth : undefined }}
        >
          {renderCard(items[0], {
            ...callbacks,
            isFetchingPriceFor: () => false,
            isListing: false,
            isLocked: () => false,
            isSelected: () => false,
            priceValueFor: () => 0,
            onListSingle: () => {},
            onOpenPriceModal: () => {},
            onPriceChange: () => {},
            onToggleLock: () => {},
            onToggleSelect: () => {},
          })}
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState>
          <Typography type='h3'>{t('dashboard.inventoryManager.empty.title')}</Typography>
          <Typography color='muted' type='body-sm'>
            {t('dashboard.inventoryManager.empty.description')}
          </Typography>
        </EmptyState>
      ) : (
        width > 0 && (
          <Grid
            cellComponent={Cell}
            cellProps={{ items, realColumnCount, rowCount, cardWidth, callbacks }}
            className='py-6'
            columnCount={realColumnCount + 2}
            gridRef={setGridApi}
            columnWidth={index =>
              index === 0 || index === realColumnCount + 1 ? PADDING : cardColumnWidth
            }
            rowCount={rowCount}
            rowHeight={rowHeight}
            style={{ height: '100%', width: '100%' }}
          />
        )
      )}
      {items.length > 0 && <BackToTopButton visible={isVisible} onPress={scrollToTop} />}
    </div>
  )
}
