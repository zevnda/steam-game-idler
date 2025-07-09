import type { Achievement, CurrentTabType, Statistic } from '@/types'
import type { ReactElement } from 'react'

import { cn, Tab, Tabs } from '@heroui/react'
import { useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import AchievementsList from '@/components/achievements/AchievementsList'
import PageHeader from '@/components/achievements/PageHeader'
import StatisticsList from '@/components/achievements/StatisticsList'
import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'
import Loader from '@/components/ui/Loader'
import useAchievements from '@/hooks/achievements/useAchievements'

export default function Achievements(): ReactElement {
  const { t } = useTranslation()
  const { setCurrentTab } = useNavigationContext()
  const { appId, sidebarCollapsed, transitionDuration } = useStateContext()
  const [isLoading, setIsLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [statistics, setStatistics] = useState<Statistic[]>([])
  const [protectedAchievements, setProtectedAchievements] = useState(false)
  const [protectedStatistics, setProtectedStatistics] = useState(false)
  const achievementStates = useAchievements(
    setIsLoading,
    setAchievements,
    setStatistics,
    setProtectedAchievements,
    setProtectedStatistics,
  )

  if (isLoading)
    return (
      <div className={cn('overflow-y-auto overflow-x-hidden bg-base w-calc')}>
        <Loader />
      </div>
    )

  return (
    <div
      className={cn(
        'bg-base overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <Image
        src={`https://cdn.steamstatic.com/steam/apps/${appId}/library_hero.jpg`}
        className='absolute top-0 left-0 w-full h-full object-cover'
        alt='background'
        width={1920}
        height={1080}
        priority
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 40%)',
        }}
      />
      <div className='absolute top-0 left-0 bg-base/50 w-full h-screen' />

      <div className='p-4'>
        <PageHeader protectedAchievements={protectedAchievements} protectedStatistics={protectedStatistics} />
      </div>

      <div className='relative flex flex-wrap gap-4 mt-2'>
        <div className='flex flex-col w-full'>
          <Tabs
            aria-label='Settings tabs'
            color='default'
            variant='solid'
            radius='full'
            className='max-w-[300px] ml-5'
            classNames={{
              tabList: 'gap-0 w-full bg-tab-panel ml-7 mt-4',
              tab: cn('data-[hover-unselected=true]:!bg-item-hover', 'data-[hover-unselected=true]:opacity-100'),
              cursor: '!bg-item-active w-full',
              tabContent: 'text-sm group-data-[selected=true]:text-content text-altwhite font-bold',
              panel: 'p-0 py-10 pl-8 ml-12 mr-10 mt-4 rounded-xl h-calc bg-base/60',
            }}
            onSelectionChange={e => setCurrentTab(e as CurrentTabType)}
          >
            <Tab key='achievements' title={t('achievementManager.achievements.title')}>
              <AchievementsList
                achievements={achievements}
                setAchievements={setAchievements}
                protectedAchievements={protectedAchievements}
                windowInnerHeight={achievementStates.windowInnerHeight}
              />
            </Tab>
            <Tab key='statistics' title={t('achievementManager.statistics.title')}>
              <StatisticsList
                statistics={statistics}
                setStatistics={setStatistics}
                setAchievements={setAchievements}
                windowInnerHeight={achievementStates.windowInnerHeight}
              />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
