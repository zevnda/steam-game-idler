import type { ActivePageType, CustomListType } from '@/shared/types'
import type { ReactElement } from 'react'
import { useEffect } from 'react'
import Achievements from '@/features/achievement-manager/Achievements'
import AchievementUnlocker from '@/features/achievement-unlocker/AchievementUnlocker'
import CardFarming from '@/features/card-farming/CardFarming'
import CustomList from '@/features/customlists/CustomList'
import FreeGamesList from '@/features/gameslist/FreeGamesList'
import GamesList from '@/features/gameslist/GamesList'
import IdlingGamesList from '@/features/gameslist/IdlingGamesList'
import Settings from '@/features/settings/Settings'
import TradingCardsList from '@/features/trading-card-manager/TradingCardsList'
import { useNavigationStore } from '@/shared/stores/navigationStore'
import { useStateStore } from '@/shared/stores/stateStore'
import Sidebar from '@/shared/ui/sidebar/Sidebar'
import Titlebar from '@/shared/ui/titlebar/Titlebar'
import { antiAwayStatus } from '@/shared/utils/tasks'

export default function Dashboard(): ReactElement {
  const showAchievements = useStateStore(state => state.showAchievements)
  const isCardFarming = useStateStore(state => state.isCardFarming)
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const activePage = useNavigationStore(state => state.activePage)
  const setActivePage = useNavigationStore(state => state.setActivePage)

  useEffect(() => {
    setActivePage('games' as ActivePageType)
    antiAwayStatus()
  }, [setActivePage])

  const renderContent = (): ReactElement => {
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
    return (
      <>
        <Titlebar />
        <Settings />
      </>
    )
  }

  return (
    <>
      <div className='flex w-full'>
        <Sidebar />
        <Titlebar />
        <div className='z-4'>{renderContent()}</div>
      </div>
      {isCardFarming && <CardFarming activePage={activePage} />}
      {isAchievementUnlocker && <AchievementUnlocker activePage={activePage} />}
    </>
  )
}
