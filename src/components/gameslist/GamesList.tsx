import type { ReactElement } from 'react'

import { cn, Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'
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

  const [columnCount, setColumnCount] = useState(5)
  useEffect(() => {
    const updateColumnCount = () => {
      setColumnCount(window.innerWidth >= 1536 ? 7 : 5)
    }
    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  const recommendedHeight = 335
  const recentsHeight = 210
  const headerHeight = 40
  const getDynamicRowHeight = () => (sidebarCollapsed ? 175 : 160)

  const games = gamesContext.filteredGames || []
  const gameRowCount = Math.ceil(games.length / columnCount)

  const hasRecommended = !gamesContext.isLoading && gamesContext.unplayedGames.length > 0
  const hasRecent = !gamesContext.isLoading && gamesContext.recentGames.length > 0

  const rows: Array<'recommended' | 'recent' | 'header' | number> = []
  if (hasRecommended) rows.push('recommended')
  if (hasRecent) rows.push('recent')
  rows.push('header')
  for (let i = 0; i < gameRowCount; i++) rows.push(i)

  const getRowHeight = (index: number) => {
    const rowType = rows[index]
    if (rowType === 'recommended') return recommendedHeight
    if (rowType === 'recent') return recentsHeight
    if (rowType === 'header') return headerHeight
    return getDynamicRowHeight()
  }

  const totalHeight = rows.reduce<number>((sum, _, idx) => sum + getRowHeight(idx), 0)
  const listHeight = Math.min(totalHeight, window.innerHeight - 168)

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
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
          <p className='text-lg font-black px-4'>All Games</p>
        </div>
      )
    }
    if (typeof rowType === 'number') {
      return (
        <div style={style} className={`grid gap-x-4 gap-y-4 px-4 ${columnCount === 7 ? 'grid-cols-7' : 'grid-cols-5'}`}>
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
        <>
          <PageHeader
            sortStyle={gamesContext.sortStyle}
            setSortStyle={gamesContext.setSortStyle}
            filteredGames={gamesContext.filteredGames}
            visibleGames={gamesContext.visibleGames}
            setRefreshKey={gamesContext.setRefreshKey}
          />
        </>
      )}

      {!gamesContext.isLoading ? (
        <List
          key={sidebarCollapsed ? 'collapsed' : 'expanded'}
          height={listHeight}
          itemCount={rows.length}
          itemSize={getRowHeight}
          width={'100%'}
          style={{
            overflowX: 'hidden',
            minHeight: window.innerHeight - 168,
          }}
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
