import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbPlayerPlayFilled, TbPlayerStopFilled, TbPlus, TbSettings } from 'react-icons/tb'
import { useAchievementUnlockerQueue } from '../hooks/useAchievementUnlockerQueue'
import { useAchievementUnlockerRun } from '../hooks/useAchievementUnlockerRun'
import { errorMessageKey as achievementUnlockerErrorMessageKey } from '../utils/errorMessageKey'
import { AchievementUnlockerBrowseGrid } from './AchievementUnlockerBrowseGrid'
import { AchievementUnlockerListGrid } from './AchievementUnlockerListGrid'
import { AchievementUnlockerQueuePreview } from './AchievementUnlockerQueuePreview'
import {
  AchievementUnlockerDetails,
  AchievementUnlockerOverview,
} from './AchievementUnlockerRunView'
import { AchievementUnlockerScanProgressCard } from './AchievementUnlockerScanProgressCard'
import {
  Alert,
  AlertDialog,
  Button,
  cn,
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
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { ManualAddGameModal } from '@/shared/components/ManualAddGameModal'
import { RunScreen } from '@/shared/components/running/RunScreen'
import { useOwnedGameSort } from '@/shared/hooks/useOwnedGameSort'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useAchievementOrderStore } from '@/shared/stores/achievementOrderStore'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { useSearchStore } from '@/shared/stores/searchStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'
import { switchViewWithTransition } from '@/shared/utils/pageTransition'
import { OWNED_GAME_SORT_LABEL_KEYS, sortOwnedGames } from '@/shared/utils/sortOwnedGames'

type AchievementUnlockerTab = 'browse' | 'queue'

// Mirrors favorites/FavoritesPage.tsx's Browse/list two-tab shape - the same "add/remove membership
// in a per-account list" pattern, just for the achievement-unlocker queue instead of favorites.
// Global search (Step 2) filters only the "browse" tab's `games` array for the same reason
// FavoritesPage's browse tab does: the "queue" tab deliberately stays unfiltered because
// AchievementUnlockerListGrid's `onReorder` replaces the *entire* persisted queue order
// (`set_achievement_unlocker_queue_order`) - filtering its `queue` prop would let a drag during an
// active search silently drop every filtered-out queued game from the saved order. See
// FavoritesPage.tsx's matching comment for the full reasoning. Unlike FavoritesListGrid, the queue
// tab's own grid IS virtualized (AchievementUnlockerListGrid.tsx) - "Add all to queue" below can
// push it well past "small/bounded".
export const AchievementUnlockerPage = () => {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const openSettings = useSettingsModalStore(state => state.open)
  const account = useSessionStore(state => state.account)
  const { phase, games, errorCode: gamesErrorCode, refresh } = useGamesList()
  const {
    queue,
    isLoading: queueLoading,
    errorCode: queueErrorCode,
    pendingAppIds,
    addToQueue,
    removeFromQueue,
    reorder,
    toggleQueued,
    refresh: refreshQueue,
  } = useAchievementUnlockerQueue()
  const openOrderEditor = useAchievementOrderStore(state => state.open)
  const [activeTab, setActiveTab] = useState<AchievementUnlockerTab>('browse')
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [confirmAddAllOpen, setConfirmAddAllOpen] = useState(false)
  const [isManualAddOpen, setIsManualAddOpen] = useState(false)
  // Lives in `achievementUnlockerStore` (account-keyed, survives this page unmounting) rather than
  // local state - see that store's `dismissedFinished` doc comment for why: a page remount must not
  // resurrect an already-dismissed summary.
  const accountKey = account ? getAccountKey(account) : null
  const dismissedFinished = useAchievementUnlockerStore(state => state.dismissedFinishedForActive)
  const dismissFinished = useAchievementUnlockerStore(state => state.dismissFinished)
  const searchQuery = useSearchStore(state => state.queries.achievementUnlocker ?? '')
  const setActiveTabSearchable = useSearchStore(state => state.setActiveTabSearchable)
  const filteredGames = useMemo(() => searchGames(games, searchQuery), [games, searchQuery])
  // Persisted across navigation/reload/restart via `sortPreferencesStore` (localStorage) - see
  // GamesPage.tsx's identical wiring.
  const sortStyle = useSortPreferencesStore(state => state.achievementUnlocker)
  const setSortStyle = useSortPreferencesStore(state => state.setSortPreference)
  const { options: sortStyleOptions, effectiveStyle: effectiveSortStyle } =
    useOwnedGameSort(sortStyle)
  const sortedFilteredGames = useMemo(
    () => sortOwnedGames(filteredGames, effectiveSortStyle, i18n.language),
    [filteredGames, effectiveSortStyle, i18n.language],
  )
  const {
    state: runState,
    isStarting,
    isStopping,
    errorCode: runErrorCode,
    start,
    stop,
  } = useAchievementUnlockerRun()

  const queuedAppIds = useMemo(() => new Set(queue.map(game => game.appId)), [queue])
  const showFinishedSummary =
    !runState.isRunning && !dismissedFinished && runState.completed.length > 0

  // Adds every currently browse-visible game (i.e. already filtered by global search + sorted) that
  // isn't already queued, in one `reorder` call rather than N sequential `addToQueue` round trips -
  // `reorder` persists the full queue order via `set_achievement_unlocker_queue_order` and already
  // has optimistic-update handling built in, so appending here reuses that instead of adding a new
  // bulk-add Tauri command.
  const addableGames = useMemo(
    () => sortedFilteredGames.filter(game => !queuedAppIds.has(game.appId)),
    [sortedFilteredGames, queuedAppIds],
  )
  const handleAddAllToQueue = () => {
    if (addableGames.length === 0) return
    reorder([
      ...queue,
      ...addableGames.map(game => ({ appId: game.appId, name: game.name ?? String(game.appId) })),
    ])
  }

  useEffect(() => {
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  const handleStop = async () => {
    await stop()
  }

  // A run auto-dequeues each game as it finishes, but `AchievementUnlockerState`'s change event
  // doesn't carry the queue (see useAchievementUnlockerQueue's `refresh` doc comment) - so the
  // queue tab/header count otherwise stay stale until the page remounts. Refetch once on the
  // running->stopped edge (covers both a full run completing and a manual stop) rather than on
  // every state event, since the queue tab isn't even rendered while a run is active.
  // `showFinishedSummary`'s own re-arming for the next run lives in achievementUnlockerStore's
  // `updateState` now, not here - see that store's `dismissedFinished` doc comment.
  const wasRunning = useRef(runState.isRunning)
  useEffect(() => {
    if (wasRunning.current && !runState.isRunning) {
      refreshQueue()
    }
    wasRunning.current = runState.isRunning
  }, [runState.isRunning, refreshQueue])

  // Search only filters the "browse" tab (see the file-level comment above) - hide the titlebar
  // affordance entirely while on the unfiltered "queue" tab, while a run is active, or while the
  // finished summary is showing (none of the tabs render at all then -
  // AchievementUnlockerProgressView takes over below), rather than leave it visibly present but
  // silently inert. Resets back to `true` on unmount so navigating away doesn't leave search hidden
  // elsewhere.
  useEffect(() => {
    setActiveTabSearchable(activeTab === 'browse' && !runState.isRunning && !showFinishedSummary)
    return () => setActiveTabSearchable(true)
  }, [activeTab, runState.isRunning, showFinishedSummary, setActiveTabSearchable])

  if (!account) {
    return null
  }

  // The tabs stay on screen in every state so this row never changes shape, just disabled during a
  // run, when the progress view takes their place.
  const isShowingTabs = !runState.isRunning && !showFinishedSummary
  const pageActions = (
    <>
      <Button
        isIconOnly
        aria-label={t('common.manualAdd.title')}
        variant='secondary'
        onPress={() => setIsManualAddOpen(true)}
      >
        <TbPlus fontSize={18} />
      </Button>
      <Button
        isIconOnly
        aria-label={t('common.actions.settings')}
        variant='secondary'
        onPress={() => openSettings('achievementUnlocker')}
      >
        <TbSettings fontSize={18} />
      </Button>
      {runState.isRunning ? (
        <Button isPending={isStopping} variant='danger-soft' onPress={handleStop}>
          <TbPlayerStopFilled fontSize={16} />
          {t('common.actions.stop')}
        </Button>
      ) : (
        <Button
          isDisabled={queue.length === 0}
          isPending={isStarting}
          variant='primary'
          onPress={start}
        >
          <TbPlayerPlayFilled fontSize={16} />
          {t('common.actions.start')}
        </Button>
      )}
    </>
  )

  return (
    <div className='flex h-full flex-col'>
      <PageBody>
        {(queueErrorCode || runErrorCode) && (
          <div className='px-6 pt-4'>
            <Alert status='danger'>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('dashboard.achievementUnlocker.errors.title')}</Alert.Title>
                <Alert.Description>
                  {t(
                    achievementUnlockerErrorMessageKey((queueErrorCode ?? runErrorCode) as string),
                    {
                      code: queueErrorCode ?? runErrorCode,
                    },
                  )}
                </Alert.Description>
              </Alert.Content>
            </Alert>
          </div>
        )}

        {/* While running (or showing a finished session's summary) the running screen takes the
            page over, with its own toolbar and Overview/Details tabs. The page's tabs stay
            mounted but hidden underneath, so their tab state keeps its tab list registered. */}
        {!isShowingTabs && (
          <RunScreen
            actions={pageActions}
            banner={
              runState.scanProgress && (
                <AchievementUnlockerScanProgressCard progress={runState.scanProgress} />
              )
            }
            feature='achievementUnlocker'
            isRunning={runState.isRunning}
            overview={<AchievementUnlockerOverview state={runState} />}
            startedAtMs={runState.startedAtMs}
            details={<AchievementUnlockerDetails state={runState} />}
            onDismissFinished={
              showFinishedSummary && accountKey ? () => dismissFinished(accountKey) : undefined
            }
          />
        )}

        <TabsRoot
          isDisabled={!isShowingTabs}
          className={cn(
            'tabs-transition-area flex min-h-0 flex-1 flex-col',
            !isShowingTabs && 'hidden',
          )}
          selectedKey={activeTab}
          onSelectionChange={key =>
            switchViewWithTransition('tabs', () => setActiveTab(key as AchievementUnlockerTab))
          }
        >
          <PageToolbar
            start={
              <TabListContainer className='shrink-0'>
                <TabList>
                  <Tab className='gap-2 whitespace-nowrap' id='browse'>
                    {t('common.tabs.allGames')}
                    {isShowingTabs && phase !== 'loading' && (
                      <CountChip count={filteredGames.length} />
                    )}
                    <TabIndicator />
                  </Tab>
                  <Tab className='gap-2 whitespace-nowrap' id='queue'>
                    {t('common.tabs.queue')}
                    {isShowingTabs && !queueLoading && <CountChip count={queue.length} />}
                    <TabIndicator />
                  </Tab>
                </TabList>
              </TabListContainer>
            }
          >
            {activeTab === 'browse' && (
              <div className='flex shrink-0 items-center gap-3'>
                <Button
                  isDisabled={!isShowingTabs || addableGames.length === 0}
                  variant='secondary'
                  onPress={() => setConfirmAddAllOpen(true)}
                >
                  {t('dashboard.achievementUnlocker.addAllToQueue')}
                </Button>
                <GameSortSelect
                  isDisabled={!isShowingTabs || games.length === 0}
                  ariaLabel={t('dashboard.inventoryManager.sort.label')}
                  options={sortStyleOptions.map(style => ({
                    id: style,
                    label: t(OWNED_GAME_SORT_LABEL_KEYS[style]),
                  }))}
                  value={effectiveSortStyle}
                  onChange={style => setSortStyle('achievementUnlocker', style)}
                />
              </div>
            )}
            {activeTab === 'queue' && queue.length > 0 && (
              <Button
                className='shrink-0'
                isDisabled={!isShowingTabs}
                variant='danger-soft'
                onPress={() => setConfirmClearOpen(true)}
              >
                {t('common.actions.clear')}
              </Button>
            )}
            {pageActions}
          </PageToolbar>

          {!isShowingTabs ? null : (
            <>
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
                  <AchievementUnlockerBrowseGrid
                    games={sortedFilteredGames}
                    pendingAppIds={pendingAppIds}
                    queuedAppIds={queuedAppIds}
                    onToggle={game => toggleQueued(game.appId, game.name ?? String(game.appId))}
                  />
                )}
              </TabPanel>

              <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='queue'>
                {queueLoading ? (
                  <GameGridSkeleton />
                ) : queue.length === 0 ? (
                  <PageBannerArea hasToolbar>
                    <EmptyListBanner
                      art={<AchievementUnlockerQueuePreview />}
                      description={t('dashboard.achievementUnlocker.empty.description')}
                      title={t('common.noGamesQueued')}
                      onBrowseGames={() =>
                        switchViewWithTransition('tabs', () => setActiveTab('browse'))
                      }
                      onManualAdd={() => setIsManualAddOpen(true)}
                    />
                  </PageBannerArea>
                ) : (
                  <AchievementUnlockerListGrid
                    queue={queue}
                    pendingAppIds={pendingAppIds}
                    onEditOrder={game => openOrderEditor(game.appId, game.name)}
                    onRemove={removeFromQueue}
                    onReorder={reorder}
                  />
                )}
              </TabPanel>
            </>
          )}
        </TabsRoot>

        <AlertDialog isOpen={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Heading>
                    {t('dashboard.achievementUnlocker.confirmClearQueue.title')}
                  </AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  {t('dashboard.achievementUnlocker.confirmClearQueue.description', {
                    count: queue.length,
                  })}
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button variant='secondary' onPress={() => setConfirmClearOpen(false)}>
                    {t('common.actions.cancel')}
                  </Button>
                  <Button
                    variant='danger-soft'
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

        {/* Achievement eligibility isn't known up front (see manager.rs's per-game `scan_game`) - a
          large "add all" queue means a correspondingly long initial scan pass once a run starts, so
          this warns rather than silently queuing hundreds/thousands of games with no explanation
          for why the run doesn't start unlocking immediately. */}
        <AlertDialog isOpen={confirmAddAllOpen} onOpenChange={setConfirmAddAllOpen}>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Heading>
                    {t('dashboard.achievementUnlocker.confirmAddAllToQueue.title', {
                      count: addableGames.length,
                    })}
                  </AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  {t('dashboard.achievementUnlocker.confirmAddAllToQueue.description')}
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button size='sm' variant='secondary' onPress={() => setConfirmAddAllOpen(false)}>
                    {t('common.actions.cancel')}
                  </Button>
                  <Button
                    size='sm'
                    variant='primary'
                    onPress={() => {
                      handleAddAllToQueue()
                      setConfirmAddAllOpen(false)
                    }}
                  >
                    {t('dashboard.achievementUnlocker.addAllToQueue')}
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>

        <ManualAddGameModal
          existingAppIds={queue.map(game => game.appId)}
          isOpen={isManualAddOpen}
          onAdd={addToQueue}
          onOpenChange={setIsManualAddOpen}
        />
      </PageBody>
    </div>
  )
}
