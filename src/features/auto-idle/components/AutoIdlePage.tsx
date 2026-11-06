import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbPlayerPlayFilled, TbPlus } from 'react-icons/tb'
import { useAutoIdleList } from '../hooks/useAutoIdleList'
import { errorMessageKey as autoIdleErrorMessageKey } from '../utils/errorMessageKey'
import { AutoIdleBrowseGrid } from './AutoIdleBrowseGrid'
import { AutoIdleListGrid } from './AutoIdleListGrid'
import { AutoIdleQueuePreview } from './AutoIdleQueuePreview'
import {
  Alert,
  AlertDialog,
  Button,
  EmptyState,
  Tab,
  TabIndicator,
  TabList,
  TabListContainer,
  TabPanel,
  TabsRoot,
  Typography,
} from '@heroui/react'
import { useRouter } from 'next/router'
import { NoGamesBanner } from '@/features/games-list/components/NoGamesBanner'
import { useGamesList } from '@/features/games-list/hooks/useGamesList'
import { errorMessageKey as gamesErrorMessageKey } from '@/features/games-list/utils/errorMessageKey'
import { EmptyListBanner } from '@/shared/components/dashboard/EmptyListBanner'
import { PageBannerArea } from '@/shared/components/dashboard/PageBanner'
import { PageBody } from '@/shared/components/dashboard/PageBody'
import { CountChip, PageToolbar } from '@/shared/components/dashboard/PageToolbar'
import { GameGridSkeleton } from '@/shared/components/GameGridSkeleton'
import { GameListTabPanel } from '@/shared/components/GameListTabPanel'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { ManualAddGameModal } from '@/shared/components/ManualAddGameModal'
import { useOwnedGameSort } from '@/shared/hooks/useOwnedGameSort'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useSearchStore } from '@/shared/stores/searchStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'
import { switchViewWithTransition } from '@/shared/utils/pageTransition'
import { OWNED_GAME_SORT_LABEL_KEYS, sortOwnedGames } from '@/shared/utils/sortOwnedGames'

type AutoIdleTab = 'browse' | 'queue'

// Mirrors FavoritesPage.tsx's shape (Browse/queue tabs, search only filters "browse", the queue
// tab stays unfiltered for the same reorder-data-loss reason FavoritesPage's own file-level
// comment documents - `onReorder` here replaces the *entire* persisted order too).
export const AutoIdlePage = () => {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const account = useSessionStore(state => state.account)
  const { phase, games, errorCode: gamesErrorCode, refresh } = useGamesList()
  const {
    games: queue,
    isLoading: queueLoading,
    errorCode: queueErrorCode,
    pendingAppIds,
    isStarting,
    addGame,
    removeGame,
    reorder,
    setEnabled,
    toggleQueued,
    startNow,
  } = useAutoIdleList()
  const [activeTab, setActiveTab] = useState<AutoIdleTab>('browse')
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [isManualAddOpen, setIsManualAddOpen] = useState(false)
  const searchQuery = useSearchStore(state => state.queries.autoIdle ?? '')
  const setActiveTabSearchable = useSearchStore(state => state.setActiveTabSearchable)
  const filteredGames = useMemo(() => searchGames(games, searchQuery), [games, searchQuery])
  // Persisted across navigation/reload/restart via `sortPreferencesStore` (localStorage) - see
  // GamesPage.tsx's identical wiring.
  const sortStyle = useSortPreferencesStore(state => state.autoIdle)
  const setSortStyle = useSortPreferencesStore(state => state.setSortPreference)
  const { options: sortStyleOptions, effectiveStyle: effectiveSortStyle } =
    useOwnedGameSort(sortStyle)
  const sortedFilteredGames = useMemo(
    () => sortOwnedGames(filteredGames, effectiveSortStyle, i18n.language),
    [filteredGames, effectiveSortStyle, i18n.language],
  )

  const queuedAppIds = useMemo(() => new Set(queue.map(g => g.appId)), [queue])
  const enabledCount = useMemo(() => queue.filter(g => g.enabled).length, [queue])

  useEffect(() => {
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  useEffect(() => {
    setActiveTabSearchable(activeTab === 'browse')
    return () => setActiveTabSearchable(true)
  }, [activeTab, setActiveTabSearchable])

  if (!account) {
    return null
  }

  const pageActions = (
    <>
      <Button
        isIconOnly
        aria-label={t('common.manualAdd.title')}
        onPress={() => setIsManualAddOpen(true)}
      >
        <TbPlus fontSize={18} />
      </Button>
      <Button
        isDisabled={enabledCount === 0}
        isPending={isStarting}
        variant='primary'
        onPress={startNow}
      >
        <TbPlayerPlayFilled fontSize={16} />
        {t('common.actions.start')}
      </Button>
    </>
  )

  return (
    <div className='flex h-full flex-col'>
      <PageBody>
        {queueErrorCode && (
          <div className='px-6 pt-4'>
            <Alert status='danger'>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('dashboard.autoIdle.errors.title')}</Alert.Title>
                <Alert.Description>
                  {t(autoIdleErrorMessageKey(queueErrorCode), { code: queueErrorCode })}
                </Alert.Description>
              </Alert.Content>
            </Alert>
          </div>
        )}

        <TabsRoot
          className='tabs-transition-area flex min-h-0 flex-1 flex-col'
          selectedKey={activeTab}
          onSelectionChange={key =>
            switchViewWithTransition('tabs', () => setActiveTab(key as AutoIdleTab))
          }
        >
          <PageToolbar
            start={
              <TabListContainer className='shrink-0'>
                <TabList>
                  <Tab className='gap-2 whitespace-nowrap' id='browse'>
                    {t('common.tabs.allGames')}
                    {phase !== 'loading' && <CountChip count={filteredGames.length} />}
                    <TabIndicator />
                  </Tab>
                  <Tab className='gap-2 whitespace-nowrap' id='queue'>
                    {t('common.tabs.queue')}
                    {!queueLoading && <CountChip count={queue.length} />}
                    <TabIndicator />
                  </Tab>
                </TabList>
              </TabListContainer>
            }
          >
            {activeTab === 'browse' && (
              <GameSortSelect
                isDisabled={games.length === 0}
                ariaLabel={t('dashboard.inventoryManager.sort.label')}
                options={sortStyleOptions.map(style => ({
                  id: style,
                  label: t(OWNED_GAME_SORT_LABEL_KEYS[style]),
                }))}
                value={effectiveSortStyle}
                onChange={style => setSortStyle('autoIdle', style)}
              />
            )}
            {activeTab === 'queue' && queue.length > 0 && (
              <Button
                className='shrink-0'
                variant='danger'
                onPress={() => setConfirmClearOpen(true)}
              >
                {t('common.actions.clear')}
              </Button>
            )}
            {pageActions}
          </PageToolbar>

          <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='browse'>
            {phase === 'loading' ? (
              <GameGridSkeleton />
            ) : gamesErrorCode ? (
              <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
                <Alert className='max-w-md' status='danger'>
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{t('dashboard.games.errors.title')}</Alert.Title>
                    <Alert.Description>
                      {t(gamesErrorMessageKey(gamesErrorCode), { code: gamesErrorCode })}
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
                <Button variant='secondary' onPress={refresh}>
                  {t('common.actions.tryAgain')}
                </Button>
              </div>
            ) : games.length === 0 ? (
              <PageBannerArea hasToolbar>
                <NoGamesBanner onRefresh={refresh} />
              </PageBannerArea>
            ) : filteredGames.length === 0 ? (
              <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
                <RiSearchLine fontSize={40} />
                <Typography type='h3'>{t('common.search.noResultsTitle')}</Typography>
                <Typography color='muted' type='body-sm'>
                  {t('common.search.noResultsDescription')}
                </Typography>
              </EmptyState>
            ) : (
              <AutoIdleBrowseGrid
                games={sortedFilteredGames}
                pendingAppIds={pendingAppIds}
                queuedAppIds={queuedAppIds}
                onToggle={game => toggleQueued(game.appId, game.name ?? String(game.appId))}
              />
            )}
          </TabPanel>

          <GameListTabPanel id='queue'>
            {queueLoading ? (
              <GameGridSkeleton />
            ) : queue.length === 0 ? (
              <PageBannerArea hasToolbar>
                <EmptyListBanner
                  art={<AutoIdleQueuePreview />}
                  description={t('dashboard.autoIdle.empty.description')}
                  title={t('common.noGamesQueued')}
                  onBrowseGames={() =>
                    switchViewWithTransition('tabs', () => setActiveTab('browse'))
                  }
                  onManualAdd={() => setIsManualAddOpen(true)}
                />
              </PageBannerArea>
            ) : (
              <AutoIdleListGrid
                games={queue}
                pendingAppIds={pendingAppIds}
                onRemove={removeGame}
                onReorder={reorder}
                onToggleEnabled={setEnabled}
              />
            )}
          </GameListTabPanel>
        </TabsRoot>

        <AlertDialog isOpen={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Heading>
                    {t('dashboard.autoIdle.confirmClearQueue.title')}
                  </AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  {t('dashboard.autoIdle.confirmClearQueue.description', { count: queue.length })}
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button variant='secondary' onPress={() => setConfirmClearOpen(false)}>
                    {t('common.actions.cancel')}
                  </Button>
                  <Button
                    variant='danger'
                    onPress={() => {
                      reorder([])
                      setConfirmClearOpen(false)
                    }}
                  >
                    {t('common.actions.clear')}
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>

        <ManualAddGameModal
          existingAppIds={queue.map(g => g.appId)}
          isOpen={isManualAddOpen}
          onAdd={game => addGame({ ...game, enabled: true })}
          onOpenChange={setIsManualAddOpen}
        />
      </PageBody>
    </div>
  )
}
