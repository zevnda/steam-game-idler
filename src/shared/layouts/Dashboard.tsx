import type { ActivePageType, CustomListType } from '@/shared/types'
import { useEffect } from 'react'
import { Achievements } from '@/features/achievement-manager'
import { AchievementUnlocker } from '@/features/achievement-unlocker'
import { CardFarming } from '@/features/card-farming'
import { CustomList } from '@/features/customlists'
import { FreeGamesList, GamesList, IdlingGamesList } from '@/features/gameslist'
import { Settings } from '@/features/settings'
import { TradingCardsList } from '@/features/trading-card-manager'
import { useNavigationStore, useStateStore } from '@/shared/stores'
import { Sidebar } from '@/shared/ui'
import { antiAwayStatus } from '@/shared/utils'

export const Dashboard = () => {
  const showAchievements = useStateStore(state => state.showAchievements)
  const isCardFarming = useStateStore(state => state.isCardFarming)
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const activePage = useNavigationStore(state => state.activePage)
  const setActivePage = useNavigationStore(state => state.setActivePage)

  useEffect(() => {
    setActivePage('games' as ActivePageType)
    antiAwayStatus()
  }, [setActivePage])

  const renderContent = () => {
    if (showAchievements) return <Achievements />

    const customListMap: Record<string, CustomListType> = {
      'customlists/card-farming': 'cardFarmingList',
      'customlists/achievement-unlocker': 'achievementUnlockerList',
      'customlists/auto-idle': 'autoIdleList',
      'customlists/favorites': 'favoritesList',
    }

    if (customListMap[activePage]) {
      return <CustomList key={activePage} type={customListMap[activePage]} />
    }

    switch (activePage) {
      case 'idling':
        return <IdlingGamesList />
      case 'freeGames':
        return <FreeGamesList />
      case 'tradingCards':
        return <TradingCardsList />
      default:
        return <GamesList />
    }
  }

  if (activePage === 'settings') {
    return <Settings />
  }

  return (
    <>
      <div className='flex w-full'>
        <Sidebar />
        <div className='z-4'>{renderContent()}</div>
      </div>
      {isCardFarming && <CardFarming activePage={activePage} />}
      {isAchievementUnlocker && <AchievementUnlocker activePage={activePage} />}
    </>
  )
}
