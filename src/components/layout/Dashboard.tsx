import type { ActivePageType, CustomListType } from '@/types'
import type { ReactElement } from 'react'

import { useEffect } from 'react'
import { useNavigationStore } from '@/stores/navigationStore'
import { useStateStore } from '@/stores/stateStore'

import Achievements from '@/components/achievements/Achievements'
import AchievementUnlocker from '@/components/automation/AchievementUnlocker'
import CardFarming from '@/components/automation/CardFarming'
import CustomList from '@/components/customlists/CustomList'
import FreeGamesList from '@/components/gameslist/FreeGamesList'
import GamesList from '@/components/gameslist/GamesList'
import IdlingGamesList from '@/components/gameslist/IdlingGamesList'
import Settings from '@/components/settings/Settings'
import TradingCardsList from '@/components/trading-cards/TradingCardsList'
import Header from '@/components/ui/header/Header'
import SideBar from '@/components/ui/SideBar'
import { antiAwayStatus } from '@/utils/tasks'

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
        <Header />
        <Settings />
      </>
    )
  }

  return (
    <>
      <div className='flex w-full'>
        <SideBar />
        <Header />
        <div className='z-4'>{renderContent()}</div>
      </div>
      {isCardFarming && <CardFarming activePage={activePage} />}
      {isAchievementUnlocker && <AchievementUnlocker activePage={activePage} />}
    </>
  )
}
