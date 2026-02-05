import type { Achievement, CurrentTabType, Statistic } from '@/shared/types'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, Tab, Tabs } from '@heroui/react'
import Image from 'next/image'
import AchievementsList from '@/features/achievement-manager/AchievementsList'
import useAchievements from '@/features/achievement-manager/hooks/useAchievements'
import PageHeader from '@/features/achievement-manager/PageHeader'
import StatisticsList from '@/features/achievement-manager/StatisticsList'
import { useNavigationStore } from '@/shared/stores/navigationStore'
import { useStateStore } from '@/shared/stores/stateStore'
import Loader from '@/shared/ui/Loader'

export default function Achievements(): ReactElement {
  const { t } = useTranslation()
  const setCurrentTab = useNavigationStore(state => state.setCurrentTab)
  const appId = useStateStore(state => state.appId)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const [isLoading, setIsLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [statistics, setStatistics] = useState<Statistic[]>([])
  const [protectedAchievements, setProtectedAchievements] = useState(false)
  const [protectedStatistics, setProtectedStatistics] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackImage, setFallbackImage] = useState('')
  const achievementStates = useAchievements(
    setIsLoading,
    setAchievements,
    setStatistics,
    setProtectedAchievements,
    setProtectedStatistics,
  )

  const handleImageLoad = (): void => {
    setImageLoaded(true)
  }

  const handleImageError = (): void => {
    setFallbackImage(`https://cdn.steamstatic.com/steam/apps/${appId}/header.jpg`)
  }

  return (
    <div
      className={cn(
        'overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <Image
        src={fallbackImage || `https://cdn.steamstatic.com/steam/apps/${appId}/library_hero.jpg`}
        className={cn('absolute top-0 left-0 w-full', !imageLoaded && 'hidden')}
        alt='background'
        width={1920}
        height={1080}
        priority
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 70%)',
        }}
      />
      {imageLoaded && <div className='absolute top-0 left-0 w-full h-screen bg-base/70' />}

      {/* Loader overlay */}
      {(isLoading || (!imageLoaded && !fallbackImage && !isLoading)) && (
        <div
          className={cn('absolute inset-0 flex items-center justify-center w-calc ml-62.5 z-50')}
        >
          <Loader />
        </div>
      )}

      <div className='p-4'>
        <PageHeader
          protectedAchievements={protectedAchievements}
          protectedStatistics={protectedStatistics}
        />
      </div>

      <div className='relative flex flex-wrap gap-4 mt-2'>
        <div className='flex flex-col w-full'>
          <Tabs
            aria-label='Settings tabs'
            color='default'
            variant='solid'
            radius='full'
            className='max-w-75 ml-5'
            classNames={{
              tabList: 'gap-0 w-full bg-btn-achievement-header ml-7 mt-4',
              tab: cn(
                'data-[hover-unselected=true]:!bg-item-hover',
                'data-[hover-unselected=true]:opacity-100',
              ),
              cursor: '!bg-item-active w-full',
              tabContent: 'text-sm group-data-[selected=true]:text-content text-altwhite font-bold',
              panel: 'p-0 ml-12 mr-10 mt-6 rounded-xl h-calc bg-base/50 p-4',
            }}
            onSelectionChange={e => setCurrentTab(e as CurrentTabType)}
          >
            <Tab key='achievements' title={t('achievementManager.achievements.title')}>
              <AchievementsList
                achievements={achievements}
                setAchievements={setAchievements}
                protectedAchievements={protectedAchievements}
                windowInnerHeight={achievementStates.windowInnerHeight}
                setRefreshKey={achievementStates.setRefreshKey}
              />
            </Tab>
            <Tab key='statistics' title={t('achievementManager.statistics.title')}>
              <StatisticsList
                statistics={statistics}
                setStatistics={setStatistics}
                setAchievements={setAchievements}
                windowInnerHeight={achievementStates.windowInnerHeight}
                setRefreshKey={achievementStates.setRefreshKey}
              />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
