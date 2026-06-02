import type { CustomListType } from '@/shared/types'
import { useEffect } from 'react'
// Feature imports — deferred to avoid circular deps; each feature exports its page component
import dynamic from 'next/dynamic'
import { Banner } from '@/shared/components/Banner'
import { Sidebar } from '@/shared/components/Sidebar'
import { useSessionStore, useUiStore } from '@/shared/stores'
import { antiAwayStatus } from '@/shared/utils'

const Achievements = dynamic(() =>
  import('@/features/achievement-manager').then(m => ({ default: m.Achievements })),
)
const AchievementOrderPage = dynamic(() =>
  import('@/features/achievement-unlocker').then(m => ({ default: m.AchievementOrderPage })),
)
const AchievementUnlocker = dynamic(() =>
  import('@/features/achievement-unlocker').then(m => ({ default: m.AchievementUnlocker })),
)
const CardFarming = dynamic(() =>
  import('@/features/card-farming').then(m => ({ default: m.CardFarming })),
)
const CustomList = dynamic(() =>
  import('@/features/custom-lists').then(m => ({ default: m.CustomList })),
)
const FreeGamesList = dynamic(() =>
  import('@/features/games-list').then(m => ({ default: m.FreeGamesList })),
)
const GamesList = dynamic(() =>
  import('@/features/games-list').then(m => ({ default: m.GamesList })),
)
const IdlingGamesList = dynamic(() =>
  import('@/features/games-list').then(m => ({ default: m.IdlingGamesList })),
)
const TradingCardsList = dynamic(() =>
  import('@/features/inventory-manager').then(m => ({ default: m.TradingCardsList })),
)
const Settings = dynamic(() => import('@/features/settings').then(m => ({ default: m.Settings })))

const CUSTOM_LIST_MAP: Record<string, CustomListType> = {
  'customlists/card-farming': 'cardFarmingList',
  'customlists/achievement-unlocker': 'achievementUnlockerList',
  'customlists/auto-idle': 'autoIdleList',
  'customlists/favorites': 'favoritesList',
}

export function Dashboard() {
  const selectedGame = useUiStore(s => s.selectedGame)
  const achievementOrderGame = useUiStore(s => s.achievementOrderGame)
  const isCardFarming = useSessionStore(s => s.isCardFarming)
  const isAchievementUnlocker = useSessionStore(s => s.isAchievementUnlocker)
  const activePage = useUiStore(s => s.activePage)
  const previousActivePage = useUiStore(s => s.previousActivePage)
  const setActivePage = useUiStore(s => s.setActivePage)

  const effectivePage = activePage === 'settings' ? previousActivePage : activePage

  useEffect(() => {
    setActivePage('games')
    antiAwayStatus()
  }, [setActivePage])

  const renderContent = () => {
    if (selectedGame) return <Achievements />
    if (achievementOrderGame) return <AchievementOrderPage />

    if (CUSTOM_LIST_MAP[effectivePage]) {
      return <CustomList key={effectivePage} type={CUSTOM_LIST_MAP[effectivePage]} />
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
