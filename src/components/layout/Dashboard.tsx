import type { ActivePageType, CustomListType } from '@/types'
import type { ReactElement } from 'react'

import { useEffect } from 'react'
import Image from 'next/image'

import Achievements from '@/components/achievements/Achievements'
import AchievementUnlocker from '@/components/automation/AchievementUnlocker'
import CardFarming from '@/components/automation/CardFarming'
import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'
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
  const { showAchievements, isCardFarming, isAchievementUnlocker } = useStateContext()
  const { activePage, setActivePage } = useNavigationContext()

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
      <div className='flex w-full bg-base'>
        <Image
          src='/background.webp'
          className='absolute top-0 left-0 w-full h-full object-cover pointer-events-none'
          alt='background'
          width={1920}
          height={1080}
          priority
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 40%)',
            zIndex: 1,
          }}
        />
        <div className='absolute top-0 left-0 bg-base/70 w-full h-screen backdrop-blur-lg pointer-events-none z-[2]' />

        <SideBar />
        <Header />
        <div className='z-[4]'>{renderContent()}</div>
      </div>
      {isCardFarming && <CardFarming activePage={activePage} />}
      {isAchievementUnlocker && <AchievementUnlocker activePage={activePage} />}
    </>
  )
}
