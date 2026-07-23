import type { OwnedGame } from '@/features/games-list/types'
import type { ReactNode } from 'react'
import type { CellComponentProps } from 'react-window'
import { useEffect, useRef } from 'react'
import { Grid, useGridCallbackRef } from 'react-window'
import { BackToTopButton } from './BackToTopButton'
import { useBackToTop } from '@/shared/hooks/useBackToTop'
import {
  GAME_GRID_GAP as GAP,
  GAME_CARD_INFO_HEIGHT as INFO_HEIGHT,
  GAME_CARD_THUMBNAIL_ASPECT as THUMBNAIL_ASPECT,
  useResponsiveColumnCount,
} from '@/shared/hooks/useGameGridColumns'

// Vertical padding is a plain `py-6` on react-window's own scrollable root (Grid, not a wrapper -
// so the scrollbar itself stays flush against the true edge). That works because react-window
// never sets a cell's `top` - only `transform: translateY(...)` - so each cell falls back to its
// *static* position (i.e. its normal-flow position, which honors padding-top) before the
// transform offsets it further. Horizontal is the opposite problem: react-window *does* set an
// explicit `left: 0`, and CSS resolves that against the containing block's padding-box *edge* -
// i.e. it ignores the padding value entirely, so `px-6` here would leave cards flush against the
// border with no left inset at all (confirmed empirically, not by inspection - see the
// VirtualizedGameGrid step's session notes for the isolated repro that caught this). So horizontal
// padding is instead baked into the grid's own coordinate system: one extra PADDING-wide "spacer"
// column at each end (see `columnWidth`/`Cell` below), which lands correctly because it rides on
// react-window's normal per-column offset math instead of fighting its `left:0` cell styling.
const PADDING = 24

interface VirtualizedGameGridProps {
  games: OwnedGame[]
  renderCard: (game: OwnedGame) => ReactNode
}

interface CellProps {
  games: OwnedGame[]
  // Real (card) column count - excludes the two spacer columns react-window itself is told about
  // via `columnCount` below, so index math here stays in terms of what the caller's `games` array
  // actually means.
  realColumnCount: number
  cardWidth: number
  cardHeight: number
  renderCard: (game: OwnedGame) => ReactNode
}

// Every card - including the last in a row/column - renders at this fixed `cardWidth`/`cardHeight`.
// No per-cell shrinking needed here: `columnWidth`/`rowHeight` below already allocate each *slot* as
// card+trailing-gap (or just card, for the last row/column, which has nothing to gap against) - see
// this file's `cardWidth` comment for why that split has to happen there and not here.
const Cell = ({
  ariaAttributes,
  columnIndex,
  rowIndex,
  style,
  games,
  realColumnCount,
  cardWidth,
  cardHeight,
  renderCard,
}: CellComponentProps<CellProps>) => {
  // Column 0 and the last column are PADDING-wide spacers, not real cards - see this file's top
  // comment on why horizontal padding is done this way instead of CSS padding.
  if (columnIndex === 0 || columnIndex === realColumnCount + 1) return null
  const game = games[rowIndex * realColumnCount + (columnIndex - 1)]
  if (!game) return null
  return (
    <div {...ariaAttributes} style={{ ...style, width: cardWidth, height: cardHeight }}>
      {renderCard(game)}
    </div>
  )
}

// Shared virtualized replacement for every `OwnedGame[]` grid that can grow large (games-list's
// full library, idling's "every owned game" list, favorites' "All Games" browse tab) - one
// parameterized component instead of three near-identical CSS grids. `react-window` v2's `Grid`
// renders rows and columns natively via `cellComponent`, unlike v1's
// `VariableSizeList` (which `main`'s GamesList.tsx used and had to manually chunk the flat games
// array into per-row slices itself).
//
// Deliberately NOT applied to `FavoritesListGrid` (the drag-reorder "Favorites" tab) - it uses
// `@dnd-kit`'s `SortableContext`, which needs every item mounted in the DOM simultaneously to
// measure/track for drag reordering; virtualizing it would fight the drag library for little
// benefit, since a user's curated favorites list is inherently bounded, unlike a full game
// library. Achievement/stat lists (some games ship 300+ achievements) are virtualized too, but
// via `react-window`'s single-column `List` instead of this component's `Grid` - see
// `achievement-manager/components/AchievementsList.tsx`.
export const VirtualizedGameGrid = ({ games, renderCard }: VirtualizedGameGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [gridApi, setGridApi] = useGridCallbackRef()
  const { setScrollElement, isVisible, scrollToTop } = useBackToTop()
  useEffect(() => setScrollElement(gridApi?.element ?? null), [gridApi, setScrollElement])
  // The container is measured full-bleed (no padding of its own - see this file's top comment), so
  // the hook's own PADDING/SCROLLBAR_WIDTH reservation is what leaves cards the actual space they
  // have to lay out in (without it, columns would size to the *full* measured width, but the
  // moment a vertical scrollbar actually renders - i.e. almost always, once there are enough games
  // - it'd eat into that same width from *inside* the Grid's own box, forcing an unwanted
  // horizontal scrollbar on top of the vertical one).
  const {
    width,
    usableWidth,
    columnCount: realColumnCount,
  } = useResponsiveColumnCount(containerRef)
  // `usableWidth` has to fit N cards plus the (N-1) gaps *between* them - not N gaps, which is what
  // `usableWidth / realColumnCount - GAP` (an earlier version of this formula) worked out to: that
  // reserved a trailing GAP for every column including the last, which has no following card to gap
  // against, leaving one GAP's worth of dead space unaccounted for (it showed up as a gap wider than
  // intended somewhere along the right edge, however the leftover space happened to get allocated).
  // This is the same `(usableWidth - GAP * (columnCount - 1)) / columnCount` shape GamesList.tsx's
  // flex-row cards already use correctly.
  const cardWidth = (usableWidth - GAP * (realColumnCount - 1)) / realColumnCount
  const cardHeight = Math.round(cardWidth * THUMBNAIL_ASPECT) + INFO_HEIGHT
  const rowCount = Math.ceil(games.length / realColumnCount)

  return (
    // No horizontal padding here (or on Grid) - see this file's top comment. `h-full w-full` only,
    // so react-window's own scrollbar sits flush against this container's true edge. `relative`
    // only affects positioning context (not layout), so it's safe alongside that - it's what lets
    // BackToTopButton below anchor to this grid's own viewport instead of the whole app window.
    <div ref={containerRef} className='relative h-full w-full'>
      {width > 0 && (
        <Grid
          cellComponent={Cell}
          cellProps={{ games, realColumnCount, cardWidth, cardHeight, renderCard }}
          className='py-6'
          columnCount={realColumnCount + 2}
          gridRef={setGridApi}
          // Every real column's slot is `cardWidth` plus a trailing GAP to the next card - except
          // the last real column, which has no next card to gap against, so its slot is `cardWidth`
          // alone (sits flush against the right PADDING spacer instead of leaving a dead GAP before
          // it).
          columnWidth={index => {
            if (index === 0 || index === realColumnCount + 1) return PADDING
            if (index === realColumnCount) return cardWidth
            return cardWidth + GAP
          }}
          rowCount={rowCount}
          // Mirrors columnWidth above for the vertical axis: the last row's slot is `cardHeight`
          // alone so it sits flush against the bottom `py-6` padding instead of leaving a dead GAP
          // beneath it.
          rowHeight={index => (index === rowCount - 1 ? cardHeight : cardHeight + GAP)}
          style={{ height: '100%', width: '100%' }}
        />
      )}
      <BackToTopButton visible={isVisible} onPress={scrollToTop} />
    </div>
  )
}
