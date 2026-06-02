import type { CurrentTabType } from '@/shared/types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, Tab, Tabs } from '@heroui/react'
import Image from 'next/image'
import { AchievementsList } from '@/features/achievement-manager/components/AchievementsList'
import { PageHeader } from '@/features/achievement-manager/components/PageHeader'
import { StatisticsList } from '@/features/achievement-manager/components/StatisticsList'
import { useAchievements } from '@/features/achievement-manager/hooks/useAchievements'
import { Loader } from '@/shared/components/Loader'
import { useUiStore } from '@/shared/stores'

export function Achievements() {
  const { t } = useTranslation()
  const setCurrentTab = useUiStore(s => s.setCurrentTab)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const {
    isLoading,
    achievements,
    setAchievements,
    statistics,
    setStatistics,
    protectedAchievements,
    protectedStatistics,
    windowHeight,
    setRefreshKey,
    appId,
  } = useAchievements()

  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackImage, setFallbackImage] = useState('')

  useEffect(() => {
    setImageLoaded(false)
    setFallbackImage('')
  }, [appId])

  return (
    <div
      className={cn(
        'overflow-y-auto overflow-x-hidden mt-12 ease-in-out',
        sidebarCollapsed ? 'w-calc-collapsed' : 'w-calc',
      )}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
      <Image
        src={fallbackImage || `https://cdn.steamstatic.com/steam/apps/${appId}/library_hero.jpg`}
        className={cn('absolute top-0 left-0 w-full', !imageLoaded && 'hidden')}
        alt='background'
        width={1920}
        height={1080}
        priority
        onLoad={() => setImageLoaded(true)}
        onError={() =>
          setFallbackImage(`https://cdn.steamstatic.com/steam/apps/${appId}/header.jpg`)
        }
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,0) 55%)',
        }}
      />
      {imageLoaded && <div className='absolute top-0 left-0 w-full h-screen bg-base/80' />}

      {(isLoading || (!imageLoaded && !fallbackImage && !isLoading)) && (
        <div
          className={cn('absolute inset-0 flex items-center justify-center w-calc ml-62.5 z-50')}
        >
          <Loader />
        </div>
      )}

      <div className='relative z-10'>
        <PageHeader
          protectedAchievements={protectedAchievements}
          protectedStatistics={protectedStatistics}
        />

        <div className='px-6'>
          <Tabs
            size='lg'
            aria-label='Achievements tabs'
            color='default'
            variant='solid'
            radius='full'
            classNames={{
              tabList: 'gap-0 w-fit bg-card border border-border/20 px-1 py-1',
              tab: 'data-[hover-unselected=true]:!bg-item-hover data-[hover-unselected=true]:opacity-100',
              cursor: '!bg-surface rounded-full w-full',
              tabContent:
                'text-sm group-data-[selected=true]:text-content text-altwhite/60 font-semibold',
              panel: 'p-0 mt-4',
            }}
            onSelectionChange={e => setCurrentTab(e as CurrentTabType)}
          >
            <Tab key='achievements' title={t('achievementManager.achievements.title')}>
              <AchievementsList
                achievements={achievements}
                setAchievements={setAchievements}
                protectedAchievements={protectedAchievements}
                windowInnerHeight={windowHeight}
                setRefreshKey={setRefreshKey}
              />
            </Tab>
            <Tab key='statistics' title={t('achievementManager.statistics.title')}>
              <StatisticsList
                statistics={statistics}
                setStatistics={setStatistics}
                setAchievements={setAchievements}
                windowInnerHeight={windowHeight}
                setRefreshKey={setRefreshKey}
              />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
