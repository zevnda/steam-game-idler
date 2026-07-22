import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbDeviceGamepad2, TbPlayerPlay } from 'react-icons/tb'
import { useAutoIdleList } from '../hooks/useAutoIdleList'
import { errorMessageKey as autoIdleErrorMessageKey } from '../utils/errorMessageKey'
import { AutoIdleBrowseGrid } from './AutoIdleBrowseGrid'
import { AutoIdleListGrid } from './AutoIdleListGrid'
import { AutoIdlePageHeader } from './AutoIdlePageHeader'
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
import { GameListTabPanel } from '@/shared/components/GameListTabPanel'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { ManualAddGameModal } from '@/shared/components/ManualAddGameModal'
import { useOwnedGameSort } from '@/shared/hooks/useOwnedGameSort'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useSearchStore } from '@/shared/stores/searchStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'
import { OWNED_GAME_SORT_LABEL_KEYS, sortOwnedGames } from '@/shared/utils/sortOwnedGames'

type AutoIdleTab = 'browse' | 'queue'

// Mirrors FavoritesPage.tsx's shape (Browse/queue tabs, search only filters "browse", the queue
// tab stays unfiltered for the same reorder-data-loss reason FavoritesPage's own file-level
// comment documents - `onReorder` here replaces the *entire* persisted order too).
export const AutoIdlePage = () => {
  const { t } = useTranslation()
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
    () => sortOwnedGames(filteredGames, effectiveSortStyle),
    [filteredGames, effectiveSortStyle],
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

  return (
    <div className='flex h-full flex-col'>
      <AutoIdlePageHeader
        enabledCount={enabledCount}
        gameCount={queue.length}
        isStarting={isStarting}
        onManualAdd={() => setIsManualAddOpen(true)}
        onStartNow={startNow}
      />

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
        className='flex min-h-0 flex-1 flex-col'
        selectedKey={activeTab}
        onSelectionChange={key => setActiveTab(key as AutoIdleTab)}
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
              options={sortStyleOptions.map(style => ({
                id: style,
                label: t(OWNED_GAME_SORT_LABEL_KEYS[style]),
              }))}
              value={effectiveSortStyle}
              onChange={style => setSortStyle('autoIdle', style)}
            />
          )}
          {activeTab === 'queue' && queue.length > 0 && (
            <Button className='shrink-0' variant='danger' onPress={() => setConfirmClearOpen(true)}>
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
            <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className='aspect-460/215 rounded-lg' />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
              <TbPlayerPlay fontSize={40} />
              <Typography type='h3'>{t('common.noGamesQueued')}</Typography>
              <Typography color='muted' type='body-sm'>
                {t('dashboard.autoIdle.empty.description')}
              </Typography>
            </EmptyState>
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
    </div>
  )
}
