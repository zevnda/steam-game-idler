import type { ReactElement } from 'react'

import { cn, Spinner } from '@heroui/react'

import { useStateContext } from '@/components/contexts/StateContext'
import PageHeader from '@/components/gameslist/PageHeader'
import Private from '@/components/gameslist/Private'
import GameCard from '@/components/ui/GameCard'
import useGamesList from '@/hooks/gameslist/useGamesList'

export default function GamesList(): ReactElement {
  const gamesContext = useGamesList()
  const { sidebarCollapsed, showAchievements, transitionDuration } = useStateContext()

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
        'min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-217px)]',
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
        <div className='grid grid-cols-5 2xl:grid-cols-7 gap-x-4 gap-y-4 p-4'>
          {gamesContext.filteredGames &&
            gamesContext.filteredGames
              .slice(0, gamesContext.visibleGames.length)
              .map(item => <GameCard key={item.appid} item={item} />)}
        </div>
      ) : (
        <div className='flex justify-center items-center w-calc h-[calc(100vh-166px)]'>
          <Spinner variant='simple' />
        </div>
      )}
    </div>
  )
}
