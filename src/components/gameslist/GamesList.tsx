import type { ReactElement } from 'react'

import { cn, Spinner } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
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

  useEffect(() => {
    const handleResize = (): void => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      setColumnCount(window.innerWidth >= 1536 ? 7 : 5)
      if (listRef.current) {
        listRef.current.resetAfterIndex(0, true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const recommendedHeight = 335
  const recentsHeight = 210
  const headerHeight = 40
  const getDynamicRowHeight = (): number => (sidebarCollapsed ? 175 : 160)

  const games = gamesContext.filteredGames || []
  const gameRowCount = Math.ceil(games.length / columnCount)

  const hasRecommended = !gamesContext.isLoading && gamesContext.unplayedGames.length > 0
  const hasRecent = !gamesContext.isLoading && gamesContext.recentGames.length > 0

  const rows: Array<'recommended' | 'recent' | 'header' | number> = []
  if (hasRecommended) rows.push('recommended')
  if (hasRecent) rows.push('recent')
  rows.push('header')
  for (let i = 0; i < gameRowCount; i++) rows.push(i)

  const getRowHeight = (index: number): number => {
    const rowType = rows[index]
    if (rowType === 'recommended') return recommendedHeight
    if (rowType === 'recent') return recentsHeight
    if (rowType === 'header') return headerHeight
    return getDynamicRowHeight()
  }

  const totalHeight = rows.reduce<number>((sum, _, idx) => sum + getRowHeight(idx), 0)
  const listHeight = Math.min(totalHeight, windowSize.height - 168)

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }): ReactElement | null => {
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
        <div style={style} className={`grid gap-x-5 gap-y-4 px-6 ${columnCount === 7 ? 'grid-cols-7' : 'grid-cols-5'}`}>
          {games.slice(rowType * columnCount, (rowType + 1) * columnCount).map(item => (
            <GameCard key={item.appid} item={item} />
          ))}
        </div>
      )
    }
    return null
  }

  if (!gamesContext.isLoading && gamesContext.gamesList.length === 0)
    return (
      <div className={cn('w-calc min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden')}>
        <Private setRefreshKey={gamesContext.setRefreshKey} />
      </div>
    )

  return (
    <div
      key={gamesContext.refreshKey}
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
      ref={gamesContext.scrollContainerRef}
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
          height={listHeight}
          itemCount={rows.length}
          itemSize={getRowHeight}
          width={windowSize.width - (sidebarCollapsed ? 56 : 250)}
          style={{
            overflowX: 'hidden',
            minHeight: windowSize.height - 168,
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
