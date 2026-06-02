import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VariableSizeList as List } from 'react-window'
import { cn, Spinner } from '@heroui/react'
import { PageHeader } from '@/features/games-list/components/PageHeader'
import { Private } from '@/features/games-list/components/Private'
import { RecentGamesCarousel } from '@/features/games-list/components/RecentGamesCarousel'
import { RecommendedGamesCarousel } from '@/features/games-list/components/RecommendedGamesCarousel'
import { useGamesList } from '@/features/games-list/hooks/useGamesList'
import { refreshGamesList } from '@/features/games-list/services/gamesListService'
import { GameCard } from '@/shared/components/GameCard'
import { useUiStore, useUserStore } from '@/shared/stores'

function useColumnCount() {
  const [count, setCount] = useState(5)
  const update = useCallback(() => {
    if (window.innerWidth >= 3200) setCount(12)
    else if (window.innerWidth >= 2300) setCount(10)
    else if (window.innerWidth >= 2000) setCount(8)
    else if (window.innerWidth >= 1500) setCount(7)
    else setCount(5)
  }, [])
  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])
  return count
}

export function GamesList() {
  const { t } = useTranslation()
  const {
    isLoading,
    gamesList,
    recentGames,
    unplayedGames,
    filteredGames,
    sortStyle,
    setSortStyle,
    incrementRefreshKey,
  } = useGamesList()
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const selectedGame = useUiStore(s => s.selectedGame)
  const userSettings = useUserStore(s => s.userSettings)
  const userSummary = useUserStore(s => s.userSummary)
  const columnCount = useColumnCount()
  const listRef = useRef<List>(null)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const update = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const rowHeight = useCallback(() => (sidebarCollapsed ? 175 : 160), [sidebarCollapsed])

  const games = useMemo(() => filteredGames ?? [], [filteredGames])
  const gameRowCount = useMemo(
    () => Math.ceil(games.length / columnCount),
    [games.length, columnCount],
  )

  const hasRecommended = useMemo(
    () =>
      !isLoading &&
      unplayedGames.length > 0 &&
      userSettings?.general?.showRecommendedCarousel !== false,
    [isLoading, unplayedGames.length, userSettings?.general?.showRecommendedCarousel],
  )
  const hasRecent = useMemo(
    () =>
      !isLoading && recentGames.length > 0 && userSettings?.general?.showRecentCarousel !== false,
    [isLoading, recentGames.length, userSettings?.general?.showRecentCarousel],
  )

  const rows = useMemo((): Array<'recommended' | 'recent' | 'header' | number> => {
    const r: Array<'recommended' | 'recent' | 'header' | number> = []
    if (hasRecommended) r.push('recommended')
    if (hasRecent) r.push('recent')
    r.push('header')
    for (let i = 0; i < gameRowCount; i++) r.push(i)
    return r
  }, [hasRecommended, hasRecent, gameRowCount])

  useEffect(() => {
    if (listRef.current) listRef.current.resetAfterIndex(0, true)
  }, [rows])

  const getRowHeight = useCallback(
    (index: number) => {
      const type = rows[index]
      if (type === 'recommended') return 335
      if (type === 'recent') return 210
      if (type === 'header') return 40
      return rowHeight()
    },
    [rows, rowHeight],
  )

  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowType = rows[index]
    if (rowType === 'recommended')
      return (
        <div style={style}>
          <RecommendedGamesCarousel unplayedGames={unplayedGames} />
        </div>
      )
    if (rowType === 'recent')
      return (
        <div style={style}>
          <RecentGamesCarousel
            recentGames={recentGames}
            sortStyle={sortStyle}
            setSortStyle={setSortStyle}
          />
        </div>
      )
    if (rowType === 'header')
      return (
        <div style={style}>
          <p className='text-xs font-black uppercase tracking-wide text-altwhite/60 px-6'>
            {t('gamesList.allGames')}
          </p>
        </div>
      )
    if (typeof rowType === 'number') {
      return (
        <div
          style={style}
          className={cn(
            'grid gap-x-5 gap-y-4 px-6',
            columnCount === 7 ? 'grid-cols-7' : 'grid-cols-5',
            columnCount === 8 ? 'grid-cols-8' : '',
            columnCount === 10 ? 'grid-cols-10' : '',
            columnCount === 12 ? 'grid-cols-12' : '',
          )}
        >
          {games.slice(rowType * columnCount, (rowType + 1) * columnCount).map(item => (
            <GameCard key={item.appid} item={item} />
          ))}
        </div>
      )
    }
    return null
  })

  if (!isLoading && gamesList.length === 0) {
    return (
      <div className={cn('w-calc min-h-calc max-h-calc overflow-x-hidden')}>
        <Private
          onRefresh={() => refreshGamesList(userSummary?.steamId, incrementRefreshKey, true)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn('mt-12 ease-in-out', sidebarCollapsed ? 'w-calc-collapsed' : 'w-calc')}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
      {!selectedGame && (
        <PageHeader
          sortStyle={sortStyle}
          setSortStyle={setSortStyle}
          filteredGames={filteredGames}
          incrementRefreshKey={incrementRefreshKey}
        />
      )}
      {!isLoading ? (
        <List
          key={
            sidebarCollapsed
              ? `collapsed-${windowSize.width}x${windowSize.height}`
              : `expanded-${windowSize.width}x${windowSize.height}`
          }
          height={windowSize.height - 160}
          itemCount={rows.length}
          itemSize={getRowHeight}
          width='100%'
          style={{ overflowX: 'hidden' }}
          ref={listRef}
        >
          {Row}
        </List>
      ) : (
        <div className='flex justify-center items-center w-calc h-[calc(100vh-180px)]'>
          <Spinner variant='simple' />
        </div>
      )}
    </div>
  )
}
