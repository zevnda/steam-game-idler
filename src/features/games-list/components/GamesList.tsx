import type { ReactNode } from 'react'
import type { RowComponentProps } from 'react-window'
import type { RecommendedSlide } from '../hooks/useRecommendedSlides'
import type { OwnedGame } from '../types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { List, useListCallbackRef } from 'react-window'
import { useRecommendedSlides } from '../hooks/useRecommendedSlides'
import { GameCard } from './GameCard'
import { RecommendedBanner } from './RecommendedBanner'
import { cn, Skeleton } from '@heroui/react'
import { BackToTopButton } from '@/shared/components/BackToTopButton'
import { useBackToTop } from '@/shared/hooks/useBackToTop'
import {
  GAME_CARD_HEIGHT_RATIO,
  GAME_GRID_GAP,
  useResponsiveColumnCount,
} from '@/shared/hooks/useGameGridColumns'
import { usePlatformStore } from '@/shared/stores/platformStore'

// Steam's `library_hero` art is 1920x620. The banner keeps that shape until the limits below, then
// crops, so it never gets too short to fit its contents or tall enough to fill an ultrawide window.
const BANNER_ASPECT_RATIO = 1920 / 620
// GamesPage's loading skeleton repeats these limits and the aspect ratio in Tailwind classes.
const BANNER_MIN_HEIGHT = 340
const BANNER_MAX_HEIGHT = 420
// The list has no top padding of its own, so whichever row comes first sets the gap under the
// titlebar: this for the banner, and the toolbar's own top padding when there's no banner. That same
// toolbar padding is also the gap beneath the banner, so the banner needs none of its own.
const BANNER_TOP_GAP = 14
// Must match `--page-toolbar-height` in globals.css.
const TOOLBAR_HEIGHT = 68

type ListRow = { type: 'recommended' } | { type: 'toolbar' } | { type: 'games'; games: OwnedGame[] }

interface GamesListProps {
  games: OwnedGame[]
  recommendedGames: OwnedGame[]
  toolbar: ReactNode
  idlingAppIds: number[]
  idlePendingAppIds: Set<number>
  idleStartTimes: Record<number, number>
  onToggleIdle: (appId: number) => void
}

interface RowProps {
  rows: ListRow[]
  cardWidth: number
  cardRowHeight: number
  bannerRowHeight: number
  recommendedSlides: RecommendedSlide[]
  idlingAppIds: number[]
  idlePendingAppIds: Set<number>
  idleStartTimes: Record<number, number>
  onToggleIdle: (appId: number) => void
}

// react-window `List` row height must be known ahead of time - the `recommended` and plain `games`
// rows are computed from the measured container width (see `useResponsiveColumnCount`), the
// `toolbar` row is a fixed constant.
const getRowHeight = (index: number, props: RowProps) => {
  const row = props.rows[index]
  if (row.type === 'recommended') return props.bannerRowHeight
  if (row.type === 'toolbar') return TOOLBAR_HEIGHT
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
  recommendedSlides,
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
      <div className='px-6' style={{ ...style, paddingTop: BANNER_TOP_GAP }}>
        {recommendedSlides.length > 0 ? (
          <RecommendedBanner
            idlePendingAppIds={idlePendingAppIds}
            idlingAppIds={idlingAppIds}
            slides={recommendedSlides}
            onToggleIdle={onToggleIdle}
          />
        ) : (
          <Skeleton className='h-full w-full rounded-2xl' />
        )}
      </div>
    )
  }
  if (row.type === 'toolbar') {
    // Only reserves the space - see the sticky toolbar in `GamesList` below for what sits in it.
    return <div style={style} />
  }
  return (
    // Explicit per-card pixel width (not CSS grid `1fr` columns) - each react-window row is its
    // own independent grid/flex container, so `1fr` tracks size to that row's own content alone;
    // a row whose card has an unusually long title (breaking `min-width:0` truncation upstream)
    // could grow its column wider than the same column in every other row, since track sizing
    // isn't shared/synced across separate containers. A fixed pixel width guarantees every row's
    // columns line up regardless of content.
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
  toolbar,
  idlingAppIds,
  idlePendingAppIds,
  idleStartTimes,
  onToggleIdle,
}: GamesListProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, usableWidth, columnCount } = useResponsiveColumnCount(containerRef)
  const [listApi, setListApi] = useListCallbackRef()
  const { setScrollElement, isVisible, scrollToTop } = useBackToTop()
  useEffect(() => setScrollElement(listApi?.element ?? null), [listApi, setScrollElement])

  const cardWidth = columnCount
    ? (usableWidth - GAME_GRID_GAP * (columnCount - 1)) / columnCount
    : 0
  const cardRowHeight = Math.round(cardWidth * GAME_CARD_HEIGHT_RATIO) + GAME_GRID_GAP
  const bannerRowHeight =
    Math.round(
      Math.min(BANNER_MAX_HEIGHT, Math.max(BANNER_MIN_HEIGHT, usableWidth / BANNER_ASPECT_RATIO)),
    ) + BANNER_TOP_GAP

  // The row is held open with a skeleton while games are being checked, then dropped if none of
  // them turn out to have usable art.
  const { slides: recommendedSlides, isChecking } = useRecommendedSlides(recommendedGames)
  const showBanner = recommendedSlides.length > 0 || isChecking

  // The toolbar is one element using real `position: sticky`, not a row: rows are absolutely positioned,
  // so a sticky row could never stick. Passing it as `List`'s children puts it directly inside the
  // scroll container, where the browser moves and docks it in the same pass as the scroll itself. An
  // earlier version swapped in a second copy from a scroll listener, but scrolling runs ahead of the
  // script, so the hand-off could never quite line up.
  //
  // Its margins start it where the toolbar row is, then cancel its height from the flow, so react-window's
  // spacer after it still sets the scroll height alone. With no banner above it, it starts at the top
  // and is stuck from the beginning, so this page then looks like the others.
  const toolbarRowTop = showBanner ? bannerRowHeight : 0
  const [isToolbarStuck, setIsToolbarStuck] = useState(false)
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  useEffect(() => {
    const element = listApi?.element
    if (!element) return
    const update = () => {
      setIsToolbarStuck(element.scrollTop >= toolbarRowTop)
      // Keeps the scrollbar out from under the bar once it's docked, without starting partway down
      // the page before then. Growing with the scroll rather than switching on when the bar docks,
      // since a sudden change to the track's length would make the thumb jump.
      const docked = toolbarRowTop === 0 ? 1 : Math.min(1, element.scrollTop / toolbarRowTop)
      element.style.setProperty('--games-list-scrollbar-inset', `${docked * TOOLBAR_HEIGHT}px`)
    }
    update()
    element.addEventListener('scroll', update, { passive: true })
    return () => element.removeEventListener('scroll', update)
  }, [listApi, toolbarRowTop])

  const rows = useMemo<ListRow[]>(() => {
    const result: ListRow[] = []
    if (showBanner) result.push({ type: 'recommended' })
    result.push({ type: 'toolbar' })
    for (let i = 0; i < games.length; i += columnCount) {
      result.push({ type: 'games', games: games.slice(i, i + columnCount) })
    }
    return result
  }, [showBanner, games, columnCount])

  const rowProps: RowProps = {
    rows,
    cardWidth,
    cardRowHeight,
    bannerRowHeight,
    recommendedSlides,
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
          className='games-list-scroller pb-6'
          listRef={setListApi}
          rowComponent={GamesListRow}
          rowCount={rows.length}
          rowHeight={getRowHeight}
          rowProps={rowProps}
          style={{ height: '100%', width: '100%' }}
        >
          <div
            className='sticky top-0 z-10'
            style={{
              height: TOOLBAR_HEIGHT,
              marginTop: toolbarRowTop,
              marginBottom: -(toolbarRowTop + TOOLBAR_HEIGHT),
            }}
          >
            {/* Only on once content can pass behind the bar. Deliberately instant: a fade here
                lagged behind the scroll and made docking feel sluggish. */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0',
                forceReducedMotion ? 'page-toolbar-solid' : 'page-toolbar-frosted',
                isToolbarStuck ? 'opacity-100' : 'opacity-0',
              )}
            />
            {toolbar}
          </div>
        </List>
      )}
      <BackToTopButton visible={isVisible} onPress={scrollToTop} />
    </div>
  )
}
