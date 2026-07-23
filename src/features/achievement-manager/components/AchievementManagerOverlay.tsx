import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAchievementManager } from '../hooks/useAchievementManager'
import { errorMessageKey } from '../utils/errorMessageKey'
import { AchievementManagerHeader } from './AchievementManagerHeader'
import { AchievementsTab } from './AchievementsTab'
import { StatisticsTab } from './StatisticsTab'
import { Alert, Button, Modal, Skeleton, TabPanel, TabsRoot } from '@heroui/react'
import Image from 'next/image'
import { useAchievementManagerStore } from '@/shared/stores/achievementManagerStore'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { heroImageUrl } from '@/shared/utils/heroImageUrl'

type AchievementManagerTab = 'achievements' | 'statistics'

// Single-game achievements/statistics overlay - mounted once in DashboardShell (see its "Mount
// points for future overlays" comment), driven entirely by achievementManagerStore so opening it
// never depends on which /dashboard/* route is active underneath.
export const AchievementManagerOverlay = () => {
  const { t } = useTranslation()
  const openGame = useAchievementManagerStore(state => state.openGame)
  const close = useAchievementManagerStore(state => state.close)
  const currentOs = usePlatformStore(state => state.currentOs)
  const [activeTab, setActiveTab] = useState<AchievementManagerTab>('achievements')
  const [query, setQuery] = useState('')
  // 0 = library_hero.jpg, 1 = header.jpg fallback, 2 = both failed - mirrors GameThumbnail.tsx's
  // single-fallback pattern, one step further since a hero crop is more likely to be missing than
  // the capsule art GameThumbnail always falls back to.
  const [heroFallbackLevel, setHeroFallbackLevel] = useState(0)
  const {
    data,
    isLoading,
    isMutating,
    loadErrorCode,
    refresh,
    toggleAchievement,
    bulkSetAchievements,
    applyStagedChanges,
    saveStats,
    resetAllStats,
  } = useAchievementManager(openGame)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
      setActiveTab('achievements')
      setQuery('')
      setHeroFallbackLevel(0)
    }
  }

  const hasProtectedItems = Boolean(
    data?.achievements.some(achievement => achievement.protectedAchievement) ||
    data?.stats.some(stat => stat.protectedStat),
  )

  return (
    <Modal isOpen={openGame !== null} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size='cover'>
          <Modal.Dialog className='overflow-hidden p-0'>
            <TabsRoot
              className='relative flex min-h-0 flex-1 flex-col'
              selectedKey={activeTab}
              onSelectionChange={key => {
                setActiveTab(key as AchievementManagerTab)
                setQuery('')
              }}
            >
              {/* Hero art sits absolutely positioned against Modal.Dialog (which never scrolls),
                  not inside Modal.Body - Modal.Body's own vertical scrollbar narrows its available
                  width, which broke edge-to-edge sizing when this lived inside it (confirmed live:
                  a visible gap opened up on the scrollbar side only). Pinned as a permanent banner
                  above the achievements/statistics list rather than scrolling away with content
                  (unlike main's Achievements.tsx) - Modal.Body's own scroll was replaced by each
                  tab's virtualized list owning its own internal scroll (see AchievementsList.tsx),
                  so there's no longer an ambient page scroll for the hero to scroll away with. */}
              {openGame && heroFallbackLevel < 2 && (
                <div className='absolute inset-x-0 top-0 z-0 h-full overflow-hidden'>
                  <Image
                    fill
                    unoptimized
                    alt={`${openGame.name} background art`}
                    className='object-cover'
                    src={heroImageUrl(openGame.appId, heroFallbackLevel === 1)}
                    onError={() => setHeroFallbackLevel(level => level + 1)}
                  />
                  <div className='from-overlay via-overlay/98 bg-black/70 absolute inset-0 bg-linear-to-t to-transparent' />
                </div>
              )}

              {openGame && (
                <AchievementManagerHeader
                  appId={openGame.appId}
                  hasProtectedItems={hasProtectedItems}
                  name={openGame.name}
                  query={query}
                  onClose={() => handleOpenChange(false)}
                  onQueryChange={setQuery}
                />
              )}
              <Modal.Body className='relative z-10 flex min-h-0 flex-1 flex-col m-0 p-6'>
                {isLoading ? (
                  <div className='flex flex-col gap-2'>
                    {Array.from({ length: 8 }, (_, index) => (
                      <Skeleton key={index} className='h-14 w-full rounded-lg' />
                    ))}
                  </div>
                ) : loadErrorCode ? (
                  <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
                    <Alert className='max-w-md' status='danger'>
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>{t('dashboard.achievements.errors.title')}</Alert.Title>
                        <Alert.Description>
                          {t(errorMessageKey(loadErrorCode, currentOs), { code: loadErrorCode })}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>
                    <Button variant='secondary' onPress={refresh}>
                      {t('common.actions.tryAgain')}
                    </Button>
                  </div>
                ) : (
                  data &&
                  openGame && (
                    <>
                      {/* `min-h-0 flex-1` so each tab's own virtualized list (AchievementsList/
                          StatisticsList) gets a real bounded height to size itself against - only
                          the active tab's TabPanel is actually mounted (react-aria-components'
                          default, no `shouldForceMount`), so there's never two `flex-1` siblings
                          competing for space here. `overflow-y-auto` is a safety net matching
                          FavoritesPage.tsx's identical TabPanel usage - normally inert since the
                          virtualized list already exactly fills this box and scrolls internally. */}
                      <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='achievements'>
                        <AchievementsTab
                          achievements={data.achievements}
                          appId={openGame.appId}
                          isMutating={isMutating}
                          isRefreshing={isLoading}
                          query={query}
                          onApplyStagedChanges={applyStagedChanges}
                          onBulkSet={bulkSetAchievements}
                          onRefresh={refresh}
                          onToggle={toggleAchievement}
                        />
                      </TabPanel>
                      <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='statistics'>
                        <StatisticsTab
                          isMutating={isMutating}
                          isRefreshing={isLoading}
                          query={query}
                          stats={data.stats}
                          onRefresh={refresh}
                          onResetAll={resetAllStats}
                          onSave={saveStats}
                        />
                      </TabPanel>
                    </>
                  )
                )}
              </Modal.Body>
            </TabsRoot>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
