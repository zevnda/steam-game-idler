import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbAward, TbDeviceGamepad2 } from 'react-icons/tb'
import { useAchievementUnlockerQueue } from '../hooks/useAchievementUnlockerQueue'
import { useAchievementUnlockerRun } from '../hooks/useAchievementUnlockerRun'
import { errorMessageKey as achievementUnlockerErrorMessageKey } from '../utils/errorMessageKey'
import { AchievementUnlockerBrowseGrid } from './AchievementUnlockerBrowseGrid'
import { AchievementUnlockerListGrid } from './AchievementUnlockerListGrid'
import { AchievementUnlockerPageHeader } from './AchievementUnlockerPageHeader'
import { AchievementUnlockerProgressView } from './AchievementUnlockerProgressView'
import {
  Alert,
  AlertDialog,
  Button,
  EmptyState,
  Skeleton,
  Tab,
  TabIndicator,
  TabList,
  TabListContainer,
  TabPanel,
  TabsRoot,
  Typography,
} from '@heroui/react'
import { useRouter } from 'next/router'
import { useGamesList } from '@/features/games-list/hooks/useGamesList'
import { errorMessageKey as gamesErrorMessageKey } from '@/features/games-list/utils/errorMessageKey'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { ManualAddGameModal } from '@/shared/components/ManualAddGameModal'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useAchievementOrderStore } from '@/shared/stores/achievementOrderStore'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { useSearchStore } from '@/shared/stores/searchStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'
import {
  OWNED_GAME_SORT_LABEL_KEYS,
  OWNED_GAME_SORT_STYLES,
  sortOwnedGames,
} from '@/shared/utils/sortOwnedGames'

type AchievementUnlockerTab = 'browse' | 'queue'

// Mirrors favorites/FavoritesPage.tsx's Browse/list two-tab shape - the same "add/remove membership
// in a per-account list" pattern, just for the achievement-unlocker queue instead of favorites.
// Global search (Step 2) filters only the "browse" tab's `games` array for the same reason
// FavoritesPage's browse tab does: the "queue" tab deliberately stays unfiltered because
// AchievementUnlockerListGrid's `onReorder` replaces the *entire* persisted queue order
// (`set_achievement_unlocker_queue_order`) - filtering its `queue` prop would let a drag during an
// active search silently drop every filtered-out queued game from the saved order. See
// FavoritesPage.tsx's matching comment for the full reasoning (also inherently small/bounded,
// already exempt from virtualization for the same @dnd-kit reason).
export const AchievementUnlockerPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
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
  const sortedFilteredGames = useMemo(
    () => sortOwnedGames(filteredGames, sortStyle),
    [filteredGames, sortStyle],
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

  return (
    <div className='flex h-full flex-col'>
      <AchievementUnlockerPageHeader
        activeCount={runState.active.length}
        isRunning={runState.isRunning}
        isStarting={isStarting}
        isStopping={isStopping}
        queueCount={queue.length}
        onManualAdd={() => setIsManualAddOpen(true)}
        onStart={start}
        onStop={handleStop}
      />

      {(queueErrorCode || runErrorCode) && (
        <div className='px-6 pt-4'>
          <Alert status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('dashboard.achievementUnlocker.errors.title')}</Alert.Title>
              <Alert.Description>
                {t(achievementUnlockerErrorMessageKey((queueErrorCode ?? runErrorCode) as string), {
                  code: queueErrorCode ?? runErrorCode,
                })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      {runState.isRunning || showFinishedSummary ? (
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <AchievementUnlockerProgressView
            state={runState}
            onDismissFinished={
              showFinishedSummary && accountKey ? () => dismissFinished(accountKey) : undefined
            }
          />
        </div>
      ) : (
        <TabsRoot
          className='flex min-h-0 flex-1 flex-col'
          selectedKey={activeTab}
          onSelectionChange={key => setActiveTab(key as AchievementUnlockerTab)}
        >
          <div className='mx-6 mt-4 flex items-center justify-between gap-3'>
            <TabListContainer className='shrink-0'>
              <TabList>
                <Tab className='whitespace-nowrap' id='browse'>
                  {t('common.tabs.allGames')}
                  <TabIndicator />
                </Tab>
                <Tab className='whitespace-nowrap' id='queue'>
                  {t('common.tabs.queue')}
                  <TabIndicator />
                </Tab>
              </TabList>
            </TabListContainer>
            {activeTab === 'browse' && (
              <GameSortSelect
                ariaLabel='Sort games'
                options={OWNED_GAME_SORT_STYLES.map(style => ({
                  id: style,
                  label: t(OWNED_GAME_SORT_LABEL_KEYS[style]),
                }))}
                value={sortStyle}
                onChange={style => setSortStyle('achievementUnlocker', style)}
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
          </div>

          <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='browse'>
            {phase === 'loading' ? (
              <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
                {Array.from({ length: 12 }, (_, index) => (
                  <Skeleton key={index} className='aspect-460/215 rounded-lg' />
                ))}
              </div>
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
              <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
                <TbDeviceGamepad2 fontSize={40} />
                <Typography type='h3'>{t('dashboard.games.empty.title')}</Typography>
                <Typography color='muted' type='body-sm'>
                  {t('dashboard.games.empty.description')}
                </Typography>
              </EmptyState>
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
              <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className='aspect-460/215 rounded-lg' />
                ))}
              </div>
            ) : queue.length === 0 ? (
              <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
                <TbAward fontSize={40} />
                <Typography type='h3'>{t('common.noGamesQueued')}</Typography>
                <Typography color='muted' type='body-sm'>
                  {t('dashboard.achievementUnlocker.empty.description')}
                </Typography>
              </EmptyState>
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
        </TabsRoot>
      )}

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
        existingAppIds={queue.map(game => game.appId)}
        isOpen={isManualAddOpen}
        onAdd={addToQueue}
        onOpenChange={setIsManualAddOpen}
      />
    </div>
  )
}
