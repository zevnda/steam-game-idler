import type { ActivePageType, CustomListType } from '@/shared/types'
import { useEffect } from 'react'
import { Achievements } from '@/features/achievement-manager'
import { AchievementOrderPage, AchievementUnlocker } from '@/features/achievement-unlocker'
import { CardFarming } from '@/features/card-farming'
import { CustomList } from '@/features/custom-lists'
import { FreeGamesList, GamesList, IdlingGamesList } from '@/features/games-list'
import { TradingCardsList } from '@/features/inventory-manager'
import { Settings } from '@/features/settings'
import { Banner, Sidebar } from '@/shared/components'
import { useNavigationStore, useStateStore } from '@/shared/stores'
import { antiAwayStatus } from '@/shared/utils'

export const Dashboard = () => {
  const showAchievements = useStateStore(state => state.showAchievements)
  const showAchievementOrder = useStateStore(state => state.showAchievementOrder)
  const isCardFarming = useStateStore(state => state.isCardFarming)
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const activePage = useNavigationStore(state => state.activePage)
  const previousActivePage = useNavigationStore(state => state.previousActivePage)
  const setActivePage = useNavigationStore(state => state.setActivePage)

  const effectivePage = activePage === 'settings' ? previousActivePage : activePage

  useEffect(() => {
    setActivePage('games' as ActivePageType)
    antiAwayStatus()
  }, [setActivePage])

  const renderContent = () => {
    if (showAchievements) return <Achievements />
    if (showAchievementOrder) return <AchievementOrderPage />

    const customListMap: Record<string, CustomListType> = {
      'customlists/card-farming': 'cardFarmingList',
      'customlists/achievement-unlocker': 'achievementUnlockerList',
      'customlists/auto-idle': 'autoIdleList',
      'customlists/favorites': 'favoritesList',
    }

    if (customListMap[effectivePage]) {
      return <CustomList key={effectivePage} type={customListMap[effectivePage]} />
    }

    switch (effectivePage) {
      case 'idling':
        return <IdlingGamesList />
      case 'freeGames':
        return <FreeGamesList />
      case 'inventoryManager':
        return <TradingCardsList />
      default:
        return <GamesList />
    }
  }

  return (
    <>
      <div className='flex w-full'>
        <Sidebar />
        <div className='z-4'>{renderContent()}</div>
      </div>
      {isCardFarming && <CardFarming activePage={effectivePage} />}
      {isAchievementUnlocker && <AchievementUnlocker activePage={effectivePage} />}
      <Settings />
      <Banner />
    </>
  )
}
