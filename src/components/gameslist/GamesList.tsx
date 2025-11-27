import type { CSSProperties, ReactElement } from 'react'

import { cn, Spinner } from '@heroui/react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VariableSizeList as List } from 'react-window'

import { useStateContext } from '@/components/contexts/StateContext'
import PageHeader from '@/components/gameslist/PageHeader'
import Private from '@/components/gameslist/Private'
import RecentGamesCarousel from '@/components/gameslist/RecentGamesCarousel'
import RecommendedGamesCarousel from '@/components/gameslist/RecommendedGamesCarousel'
import GameCard from '@/components/ui/GameCard'
import useGamesList from '@/hooks/gameslist/useGamesList'

export default function GamesList(): ReactElement {
  const gamesContext = useGamesList()
  const { sidebarCollapsed, showAchievements, transitionDuration } = useStateContext()
  const { t } = useTranslation()

  const [columnCount, setColumnCount] = useState(5)
  const listRef = useRef<List>(null)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  const handleResize = useCallback((): void => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    if (window.innerWidth >= 3200) {
      setColumnCount(12)
    } else if (window.innerWidth >= 2300) {
      setColumnCount(10)
    } else if (window.innerWidth >= 2000) {
      setColumnCount(8)
    } else if (window.innerWidth >= 1500) {
      setColumnCount(7)
    } else {
      setColumnCount(5)
    }
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true)
    }
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  const recommendedHeight = 335
  const recentsHeight = 210
  const headerHeight = 40
  const getDynamicRowHeight = useCallback((): number => (sidebarCollapsed ? 175 : 160), [sidebarCollapsed])

  const games = useMemo(() => gamesContext.filteredGames || [], [gamesContext.filteredGames])
  const gameRowCount = useMemo(() => Math.ceil(games.length / columnCount), [games.length, columnCount])

  const hasRecommended = useMemo(
    () => !gamesContext.isLoading && gamesContext.unplayedGames.length > 0,
    [gamesContext.isLoading, gamesContext.unplayedGames.length],
  )
  const hasRecent = useMemo(
    () => !gamesContext.isLoading && gamesContext.recentGames.length > 0,
    [gamesContext.isLoading, gamesContext.recentGames.length],
  )

  const rows = useMemo((): Array<'recommended' | 'recent' | 'header' | number> => {
    const r: Array<'recommended' | 'recent' | 'header' | number> = []
    if (hasRecommended) r.push('recommended')
    if (hasRecent) r.push('recent')
    r.push('header')
    for (let i = 0; i < gameRowCount; i++) r.push(i)
    return r
  }, [hasRecommended, hasRecent, gameRowCount])

  const getRowHeight = useCallback(
    (index: number): number => {
      const rowType = rows[index]
      if (rowType === 'recommended') return recommendedHeight
      if (rowType === 'recent') return recentsHeight
      if (rowType === 'header') return headerHeight
      return getDynamicRowHeight()
    },
    [rows, getDynamicRowHeight],
  )

  const Row = React.memo(({ index, style }: { index: number; style: CSSProperties }): ReactElement | null => {
    const rowType = rows[index]
    if (rowType === 'recommended') {
      return (
        <div style={style}>
          <RecommendedGamesCarousel gamesContext={gamesContext} />
        </div>
      )
    }
    if (rowType === 'recent') {
      return (
        <div style={style}>
          <RecentGamesCarousel gamesContext={gamesContext} />
        </div>
      )
    }
    if (rowType === 'header') {
      return (
        <div style={style}>
          <p className='text-lg font-black px-6'>{t('gamesList.allGames')}</p>
        </div>
      )
    }
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

  if (!gamesContext.isLoading && gamesContext.gamesList.length === 0)
    return (
      <div className={cn('w-calc min-h-calc max-h-calc overflow-x-hidden')}>
        <Private setRefreshKey={gamesContext.setRefreshKey} />
      </div>
    )

  return (
    <div
      key={gamesContext.refreshKey}
      className={cn('mt-9 ease-in-out', sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]')}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      {!showAchievements && (
        <PageHeader
          sortStyle={gamesContext.sortStyle}
          setSortStyle={gamesContext.setSortStyle}
          filteredGames={gamesContext.filteredGames}
          visibleGames={gamesContext.visibleGames}
          setRefreshKey={gamesContext.setRefreshKey}
        />
      )}

      {!gamesContext.isLoading ? (
        <List
          key={
            sidebarCollapsed
              ? `collapsed-${windowSize.width}x${windowSize.height}`
              : `expanded-${windowSize.width}x${windowSize.height}`
          }
          height={windowSize.height - 168}
          itemCount={rows.length}
          itemSize={getRowHeight}
          width='100%'
          style={{
            overflowX: 'hidden',
          }}
          ref={listRef}
        >
          {Row}
        </List>
      ) : (
        <div className='flex justify-center items-center w-calc h-[calc(100vh-168px)]'>
          <Spinner variant='simple' />
        </div>
      )}
    </div>
  )
}
