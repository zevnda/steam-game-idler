import type { RowComponentProps } from 'react-window'
import type { OwnedGame } from '../types'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { List, useListCallbackRef } from 'react-window'
import { GameCard } from './GameCard'
import { Typography } from '@heroui/react'
import { BackToTopButton } from '@/shared/components/BackToTopButton'
import { GameCarousel } from '@/shared/components/GameCarousel'
import { useBackToTop } from '@/shared/hooks/useBackToTop'
import {
  GAME_CARD_INFO_HEIGHT,
  GAME_CARD_THUMBNAIL_ASPECT,
  GAME_GRID_GAP,
  useResponsiveColumnCount,
} from '@/shared/hooks/useGameGridColumns'

// Fixed carousel card widths matching `main`'s own GamesList.tsx (`w-110`/`w-48`) - "Recommended"/
// "Recently Played" are a discovery surface with their own horizontal scroll, not part of the
// responsive column grid below.
const RECOMMENDED_CARD_WIDTH = 440
const RECENT_CARD_WIDTH = 192
// Row heights sized to fit each carousel's own heading + card height - tuned against the actual
// rendered heights, matching `main`'s equivalent row-height constants (335/210/40).
const RECOMMENDED_ROW_HEIGHT = 320
const RECENT_ROW_HEIGHT = 200
const HEADER_ROW_HEIGHT = 48

type ListRow =
  | { type: 'recommended' }
  | { type: 'recent' }
  | { type: 'header' }
  | { type: 'games'; games: OwnedGame[] }

interface GamesListProps {
  games: OwnedGame[]
  recommendedGames: OwnedGame[]
  recentGames: OwnedGame[]
  showRecommendedCarousel: boolean
  showRecentCarousel: boolean
  idlingAppIds: number[]
  idlePendingAppIds: Set<number>
  idleStartTimes: Record<number, number>
  onToggleIdle: (appId: number) => void
}

interface RowProps {
  rows: ListRow[]
  cardWidth: number
  cardRowHeight: number
  recommendedGames: OwnedGame[]
  recentGames: OwnedGame[]
  recommendedTitle: string
  recentTitle: string
  allGamesTitle: string
  idlingAppIds: number[]
  idlePendingAppIds: Set<number>
  idleStartTimes: Record<number, number>
  onToggleIdle: (appId: number) => void
}

// react-window `List` row height must be known ahead of time - `recommended`/`recent`/`header`
// rows are fixed constants, plain `games` rows use the responsive `cardRowHeight` computed from
// the measured container width (see `useResponsiveColumnCount`).
const getRowHeight = (index: number, props: RowProps) => {
  const row = props.rows[index]
  if (row.type === 'recommended') return RECOMMENDED_ROW_HEIGHT
  if (row.type === 'recent') return RECENT_ROW_HEIGHT
  if (row.type === 'header') return HEADER_ROW_HEIGHT
  return props.cardRowHeight
}

// One react-window `List` row per section (each carousel, the "All Games" heading, then chunked
// game rows) instead of `VirtualizedGameGrid`'s 2D `Grid` - mixing full-width, differently-sized
// carousel rows into a 2D grid's per-cell virtualization isn't practical, whereas a 1D `List` of
// heterogeneous rows (each laying its own cards out via a plain flex row of explicitly-sized
// cards - see the `cardWidth` comment below) is react-window's own documented pattern for this
// shape. This is what lets the carousels live in the same scrollable region as the games grid and
// scroll off-screen with it, matching `main`'s GamesList.tsx instead of the sticky-header
// treatment this page had before (carousels rendered above, not inside, the virtualized area).
const GamesListRow = ({
  index,
  style,
  rows,
  cardWidth,
  cardRowHeight,
  recommendedGames,
  recentGames,
  recommendedTitle,
  recentTitle,
  allGamesTitle,
  idlingAppIds,
  idlePendingAppIds,
  idleStartTimes,
  onToggleIdle,
}: RowComponentProps<RowProps>) => {
  const row = rows[index]

  const renderGameCard = (game: OwnedGame) => (
    <GameCard
      game={game}
      idleStartTime={idleStartTimes[game.appId]}
      isIdlePending={idlePendingAppIds.has(game.appId)}
      isIdling={idlingAppIds.includes(game.appId)}
      onToggleIdle={() => onToggleIdle(game.appId)}
    />
  )

  if (row.type === 'recommended') {
    return (
      <div className='px-6' style={style}>
        <GameCarousel
          autoScrollIntervalMs={7000}
          cardWidth={RECOMMENDED_CARD_WIDTH}
          itemKey={game => game.appId}
          items={recommendedGames}
          renderItem={renderGameCard}
          title={recommendedTitle}
        />
      </div>
    )
  }
  if (row.type === 'recent') {
    return (
      <div className='px-6' style={style}>
        <GameCarousel
          cardWidth={RECENT_CARD_WIDTH}
          itemKey={game => game.appId}
          items={recentGames}
          renderItem={renderGameCard}
          title={recentTitle}
        />
      </div>
    )
  }
  if (row.type === 'header') {
    return (
      <div className='flex items-end px-6 pb-2' style={style}>
        <Typography type='h4'>{allGamesTitle}</Typography>
      </div>
    )
  }
  return (
    // Explicit per-card pixel width (not CSS grid `1fr` columns) - each react-window row is its
    // own independent grid/flex container, so `1fr` tracks size to that row's own content alone;
    // a row whose card has an unusually long title (breaking `min-width:0` truncation upstream)
    // could grow its column wider than the same column in every other row, since track sizing
    // isn't shared/synced across separate containers. A fixed pixel width - the same technique
    // GameCarousel already uses - guarantees every row's columns line up regardless of content.
    <div
      className='flex px-6'
      style={{ ...style, gap: GAME_GRID_GAP, height: (style.height as number) - GAME_GRID_GAP }}
    >
      {row.games.map(game => (
        <div className='shrink-0' key={game.appId} style={{ width: cardWidth }}>
          {renderGameCard(game)}
        </div>
      ))}
    </div>
  )
}

export const GamesList = ({
  games,
  recommendedGames,
  recentGames,
  showRecommendedCarousel,
  showRecentCarousel,
  idlingAppIds,
  idlePendingAppIds,
  idleStartTimes,
  onToggleIdle,
}: GamesListProps) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, usableWidth, columnCount } = useResponsiveColumnCount(containerRef)
  const [listApi, setListApi] = useListCallbackRef()
  const { setScrollElement, isVisible, scrollToTop } = useBackToTop()
  useEffect(() => setScrollElement(listApi?.element ?? null), [listApi, setScrollElement])

  const cardWidth = columnCount
    ? (usableWidth - GAME_GRID_GAP * (columnCount - 1)) / columnCount
    : 0
  const cardRowHeight =
    Math.round(cardWidth * GAME_CARD_THUMBNAIL_ASPECT) + GAME_CARD_INFO_HEIGHT + GAME_GRID_GAP

  const rows = useMemo<ListRow[]>(() => {
    const result: ListRow[] = []
    if (showRecommendedCarousel && recommendedGames.length > 0) result.push({ type: 'recommended' })
    if (showRecentCarousel && recentGames.length > 0) result.push({ type: 'recent' })
    result.push({ type: 'header' })
    for (let i = 0; i < games.length; i += columnCount) {
      result.push({ type: 'games', games: games.slice(i, i + columnCount) })
    }
    return result
  }, [
    showRecommendedCarousel,
    recommendedGames,
    showRecentCarousel,
    recentGames,
    games,
    columnCount,
  ])

  const rowProps: RowProps = {
    rows,
    cardWidth,
    cardRowHeight,
    recommendedGames,
    recentGames,
    recommendedTitle: t('dashboard.games.carousels.recommended'),
    recentTitle: t('dashboard.games.carousels.recent'),
    allGamesTitle: t('common.tabs.allGames'),
    idlingAppIds,
    idlePendingAppIds,
    idleStartTimes,
    onToggleIdle,
  }

  return (
    // No horizontal padding here - each row applies its own `px-6`, same reasoning as
    // VirtualizedGameGrid's full-bleed container (only that one needs the spacer-column
    // workaround; a `List` row is plain document flow, so ordinary CSS padding works here).
    <div className='relative h-full w-full' ref={containerRef}>
      {width > 0 && (
        <List
          className='py-6'
          listRef={setListApi}
          rowComponent={GamesListRow}
          rowCount={rows.length}
          rowHeight={getRowHeight}
          rowProps={rowProps}
          style={{ height: '100%', width: '100%' }}
        />
      )}
      <BackToTopButton visible={isVisible} onPress={scrollToTop} />
    </div>
  )
}
