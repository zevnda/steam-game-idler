import type { GameWithDrops } from '../types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbBan, TbCards } from 'react-icons/tb'
import { useCardFarming } from '../hooks/useCardFarming'
import { useCardFarmingBlacklist } from '../hooks/useCardFarmingBlacklist'
import { useCardFarmingQueue } from '../hooks/useCardFarmingQueue'
import { errorMessageKey } from '../utils/errorMessageKey'
import {
  CARD_FARMING_SORT_LABEL_KEYS,
  CARD_FARMING_SORT_STYLES,
  sortGamesWithDrops,
} from '../utils/sortGamesWithDrops'
import { CardFarmingBlacklistGrid } from './CardFarmingBlacklistGrid'
import { CardFarmingBrowseGrid } from './CardFarmingBrowseGrid'
import { CardFarmingListGrid } from './CardFarmingListGrid'
import { CardFarmingPageHeader } from './CardFarmingPageHeader'
import { CardFarmingProgressView } from './CardFarmingProgressView'
import { CardFarmingStartPanel } from './CardFarmingStartPanel'
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
import { GameGridSkeleton } from '@/shared/components/GameGridSkeleton'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { useAutoConnectSteamCookies } from '@/shared/hooks/useAutoConnectSteamCookies'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useSearchStore } from '@/shared/stores/searchStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'

type CardFarmingTab = 'browse' | 'queue' | 'blacklist'

// Card drops remaining are detected via cookie-authenticated Steam Community scraping, unrelated
// to either sign-in backend's own session - both agent and local mode farm identically once a
// SteamID64 is resolved. Mirrors AchievementUnlockerPage's browse/queue two-tab shape. The progress
// view stays up past `isFarming` flipping false whenever the just-ended cycle left a `completed`
// summary worth showing (`showFinishedSummary` below) - dismissed explicitly via
// `CardFarmingProgressView`'s "Done" button, or implicitly by starting a new cycle
// (`cardFarmingStore`'s `dismissedFinished` resets on the next `isFarming: true` update) - rather
// than yanked away the instant `isFarming` flips, which would make actual results (cards farmed,
// games maxed out) flash by unseen.
//
// `useCardFarmingSync` (mounted in DashboardShell, not here) is what makes a running cycle survive
// navigating away from this page and back - this component only reads the store it keeps current.
//
// A third "Blacklisted" tab (`useCardFarmingBlacklist`) replaces `main`'s custom-lists-based
// blacklist management screen - blacklisting happens via a ban button on each browse card, and only
// un-blacklisting happens from this tab. `handleBlacklist` removes the game from both `browseGames`
// (optimistic) and the queue; the backend's own commands also filter blacklisted app IDs as a
// defense-in-depth backstop. `handleUnblacklist` re-scrapes via `refreshBrowse` instead of an
// optimistic local add, since a blacklist entry doesn't carry the fields a browse card needs.
//
// The connect-panel-vs-tabs branch depends on `useSteamCookiesSync` having already checked this
// account's saved cookies - `isChecking`/`isAutoConnecting` cover the window before that settles,
// so an account with already-valid cookies never flashes `CardFarmingStartPanel` first.
//
// Registered as the `cardFarming` global search scope, filtering only the "browse" tab's
// `browseGames`, same browse-tab-only wiring as FavoritesPage/AchievementUnlockerPage.
export const CardFarmingPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const account = useSessionStore(state => state.account)
  const {
    state,
    isStarting,
    isStopping,
    isConnecting,
    connected,
    errorCode,
    connectErrorCode,
    browseGames,
    isBrowseLoading,
    removeBrowseGame,
    refreshBrowse,
    allGames,
    refreshSettingsMode,
    connect,
    start,
    stop,
  } = useCardFarming()
  const {
    queue,
    isLoading: queueLoading,
    pendingAppIds,
    removeFromQueue,
    reorder,
    toggleQueued,
    refresh: refreshQueue,
  } = useCardFarmingQueue()
  const {
    blacklist,
    isLoading: blacklistLoading,
    pendingAppIds: pendingBlacklistAppIds,
    addToBlacklist,
    removeFromBlacklist,
    clearBlacklist,
  } = useCardFarmingBlacklist()
  const { isChecking, isAutoConnecting } = useAutoConnectSteamCookies(account, connect)
  const [activeTab, setActiveTab] = useState<CardFarmingTab>('browse')
  // Lives in `cardFarmingStore` (account-keyed, survives this page unmounting) rather than local
  // state - see that store's `dismissedFinished` doc comment for why: a page remount must not
  // resurrect an already-dismissed summary.
  const accountKey = account ? getAccountKey(account) : null
  const dismissedFinished = useCardFarmingStore(state => state.dismissedFinishedForActive)
  const dismissFinished = useCardFarmingStore(state => state.dismissFinished)
  // Shared by the queue and blacklist tabs' "Clear" actions - each tab clears a different list, so
  // this tracks which one the open dialog is confirming rather than duplicating the dialog itself.
  const [confirmClearTarget, setConfirmClearTarget] = useState<'queue' | 'blacklist' | null>(null)
  // Global search filters only the "browse" tab's `browseGames` array - mirrors FavoritesPage's/
  // AchievementUnlockerPage's browse-tab-only wiring. The queue/blacklist tabs stay unfiltered for
  // the same reorder-data-loss reason those pages document: `CardFarmingListGrid`'s `onReorder`
  // replaces the *entire* persisted queue order, so filtering it during an active search would let
  // a drag silently drop every filtered-out queued game.
  const searchQuery = useSearchStore(state => state.queries.cardFarming ?? '')
  const setActiveTabSearchable = useSearchStore(state => state.setActiveTabSearchable)
  const filteredBrowseGames = useMemo(
    () => searchGames(browseGames, searchQuery),
    [browseGames, searchQuery],
  )
  // Persisted across navigation/reload/restart via `sortPreferencesStore` (localStorage) - see
  // GamesPage.tsx's identical wiring.
  const sortStyle = useSortPreferencesStore(state => state.cardFarming)
  const setSortStyle = useSortPreferencesStore(state => state.setSortPreference)
  const sortedBrowseGames = useMemo(
    () => sortGamesWithDrops(filteredBrowseGames, sortStyle),
    [filteredBrowseGames, sortStyle],
  )
  const queuedAppIds = useMemo(() => new Set(queue.map(game => game.appId)), [queue])
  const displayedErrorCode = errorCode ?? connectErrorCode
  const showFinishedSummary = !state.isFarming && !dismissedFinished && state.completed.length > 0

  useEffect(() => {
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  // The Settings modal is an overlay (see useSettingsModalStore's doc comment), not a route change,
  // so this page never remounts while it's open - re-read the header's "Farming mode: ..." copy on
  // the falling edge (modal just closed), mirroring InventoryManagerPage's identical wiring, so a
  // listGames/allGames toggle saved from the modal is reflected immediately.
  const isSettingsModalOpen = useSettingsModalStore(state => state.isOpen)
  const wasSettingsModalOpenRef = useRef(false)
  useEffect(() => {
    if (wasSettingsModalOpenRef.current && !isSettingsModalOpen) {
      refreshSettingsMode()
    }
    wasSettingsModalOpenRef.current = isSettingsModalOpen
  }, [isSettingsModalOpen, refreshSettingsMode])

  // See this component's doc comment for why blacklisting also cleans up `browseGames`/`queue`
  // locally rather than waiting on a refetch.
  const handleBlacklist = async (game: GameWithDrops) => {
    await addToBlacklist({ appId: game.appId, name: game.name })
    removeBrowseGame(game.appId)
    if (queuedAppIds.has(game.appId)) {
      await removeFromQueue(game.appId)
    }
  }

  // The reverse direction has no cached `remaining`/`playtimeHours` to restore optimistically
  // (unlike `handleBlacklist`'s `removeBrowseGame`), so this re-scrapes the browse list instead -
  // see `refreshBrowse`'s doc comment.
  const handleUnblacklist = async (appId: number) => {
    await removeFromBlacklist(appId)
    await refreshBrowse()
  }

  const handleStop = async () => {
    await stop()
  }

  // A farming cycle auto-dequeues each game as its drops are exhausted, but `FarmingState`'s change
  // event doesn't carry the persisted queue (see useCardFarmingQueue's `refresh` doc comment) - so
  // the queue tab/header count otherwise stay stale until the page remounts. Refetch on the
  // farming->stopped edge (covers both a full cycle completing and a manual stop) - but that edge
  // alone misses a cycle that starts and fully resolves (every queued game already over its
  // max-playtime cap) before the backend ever emits an intermediate `isFarming: true` state: the
  // frontend then only ever observes the single terminal event, so `isFarming` goes false->false
  // and no edge fires. `state.completed` growing is the more reliable signal (it's exactly what a
  // dequeue produces), so either condition triggers a refetch. Mirrors AchievementUnlockerPage's
  // `wasRunning` transition effect, extended for this fast-cycle case.
  const wasFarming = useRef(state.isFarming)
  const prevCompletedCount = useRef(state.completed.length)
  useEffect(() => {
    if (
      (wasFarming.current && !state.isFarming) ||
      state.completed.length > prevCompletedCount.current
    ) {
      refreshQueue()
    }
    wasFarming.current = state.isFarming
    prevCompletedCount.current = state.completed.length
  }, [state.isFarming, state.completed.length, refreshQueue])

  // Search only filters the "browse" tab (see the wiring comment above) - hide the titlebar
  // affordance entirely while on the unfiltered queue/blacklist tabs, while a farming cycle is
  // active, while the finished summary is showing, or before the tabs are even showing, rather than
  // leave it visibly present but silently inert. Resets back to `true` on unmount so navigating away
  // doesn't leave search hidden elsewhere.
  useEffect(() => {
    setActiveTabSearchable(
      connected && !state.isFarming && !showFinishedSummary && activeTab === 'browse',
    )
    return () => setActiveTabSearchable(true)
  }, [connected, state.isFarming, showFinishedSummary, activeTab, setActiveTabSearchable])

  if (!account) {
    return null
  }

  return (
    <div className='flex h-full flex-col'>
      <CardFarmingPageHeader
        activeCount={state.active.length}
        allGames={allGames}
        connected={connected}
        isFarming={state.isFarming}
        isStarting={isStarting}
        isStopping={isStopping}
        queueCount={queue.length}
        onStart={start}
        onStop={handleStop}
      />

      {displayedErrorCode && (
        <div className='px-6 pt-4'>
          <Alert status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('dashboard.cardFarming.errors.title')}</Alert.Title>
              <Alert.Description>
                {t(errorMessageKey(displayedErrorCode), { code: displayedErrorCode })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      {state.isFarming || showFinishedSummary ? (
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <CardFarmingProgressView
            state={state}
            onDismissFinished={
              showFinishedSummary && accountKey ? () => dismissFinished(accountKey) : undefined
            }
          />
        </div>
      ) : isChecking || isAutoConnecting ? (
        // Neutral loading state for the (usually brief) window before the shared credentials
        // check - and any trusted auto-connect attempt it kicks off - has settled, so an account
        // with already-valid cookies never flashes the connect panel first (see
        // useAutoConnectSteamCookies's doc comment).
        <GameGridSkeleton />
      ) : !connected ? (
        <div className='flex flex-1 items-center justify-center overflow-y-auto'>
          <CardFarmingStartPanel isConnecting={isConnecting} onConnect={connect} />
        </div>
      ) : (
        <TabsRoot
          className='flex min-h-0 flex-1 flex-col'
          selectedKey={activeTab}
          onSelectionChange={key => setActiveTab(key as CardFarmingTab)}
        >
          <div className='mx-6 mt-4 flex items-center justify-between gap-3'>
            <TabListContainer className='shrink-0'>
              <TabList>
                <Tab className='whitespace-nowrap' id='browse'>
                  {t('dashboard.cardFarming.tabs.gamesWithDrops')}
                  <TabIndicator />
                </Tab>
                <Tab className='whitespace-nowrap' id='queue'>
                  {t('common.tabs.queue')}
                  <TabIndicator />
                </Tab>
                <Tab className='whitespace-nowrap' id='blacklist'>
                  {t('dashboard.cardFarming.tabs.blacklisted')}
                  <TabIndicator />
                </Tab>
              </TabList>
            </TabListContainer>
            {activeTab === 'browse' && (
              <GameSortSelect
                ariaLabel='Sort games'
                options={CARD_FARMING_SORT_STYLES.map(style => ({
                  id: style,
                  label: t(CARD_FARMING_SORT_LABEL_KEYS[style]),
                }))}
                value={sortStyle}
                onChange={style => setSortStyle('cardFarming', style)}
              />
            )}
            {activeTab === 'queue' && queue.length > 0 && (
              <Button
                className='shrink-0'
                variant='danger'
                onPress={() => setConfirmClearTarget('queue')}
              >
                {t('common.actions.clear')}
              </Button>
            )}
            {activeTab === 'blacklist' && blacklist.length > 0 && (
              <Button
                className='shrink-0'
                variant='danger'
                onPress={() => setConfirmClearTarget('blacklist')}
              >
                {t('common.actions.clear')}
              </Button>
            )}
          </div>

          <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='browse'>
            {isBrowseLoading ? (
              <GameGridSkeleton />
            ) : browseGames.length === 0 ? (
              <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
                <TbCards fontSize={40} />
                <Typography type='h3'>{t('dashboard.cardFarming.browseEmpty.title')}</Typography>
                <Typography color='muted' type='body-sm'>
                  {t('dashboard.cardFarming.browseEmpty.description')}
                </Typography>
              </EmptyState>
            ) : filteredBrowseGames.length === 0 ? (
              <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
                <RiSearchLine fontSize={40} />
                <Typography type='h3'>{t('common.search.noResultsTitle')}</Typography>
                <Typography color='muted' type='body-sm'>
                  {t('common.search.noResultsDescription')}
                </Typography>
              </EmptyState>
            ) : (
              <CardFarmingBrowseGrid
                games={sortedBrowseGames}
                pendingAppIds={pendingAppIds}
                pendingBlacklistAppIds={pendingBlacklistAppIds}
                queuedAppIds={queuedAppIds}
                onBlacklist={handleBlacklist}
                onToggle={game => toggleQueued(game.appId, game.name)}
              />
            )}
          </TabPanel>

          <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='queue'>
            {queueLoading ? (
              <GameGridSkeleton />
            ) : queue.length === 0 ? (
              <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
                <TbCards fontSize={40} />
                <Typography type='h3'>{t('common.noGamesQueued')}</Typography>
                <Typography color='muted' type='body-sm'>
                  {t('dashboard.cardFarming.empty.description')}
                </Typography>
              </EmptyState>
            ) : (
              <CardFarmingListGrid
                queue={queue}
                pendingAppIds={pendingAppIds}
                onRemove={removeFromQueue}
                onReorder={reorder}
              />
            )}
          </TabPanel>

          <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='blacklist'>
            {blacklistLoading ? (
              <GameGridSkeleton />
            ) : blacklist.length === 0 ? (
              <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
                <TbBan fontSize={40} />
                <Typography type='h3'>{t('dashboard.cardFarming.blacklistEmpty.title')}</Typography>
                <Typography color='muted' type='body-sm'>
                  {t('dashboard.cardFarming.blacklistEmpty.description')}
                </Typography>
              </EmptyState>
            ) : (
              <CardFarmingBlacklistGrid
                blacklist={blacklist}
                pendingAppIds={pendingBlacklistAppIds}
                onRemove={handleUnblacklist}
              />
            )}
          </TabPanel>
        </TabsRoot>
      )}

      <AlertDialog
        isOpen={confirmClearTarget !== null}
        onOpenChange={open => setConfirmClearTarget(open ? confirmClearTarget : null)}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {confirmClearTarget === 'blacklist'
                    ? t('dashboard.cardFarming.confirmClearBlacklist.title')
                    : t('dashboard.cardFarming.confirmClearQueue.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {confirmClearTarget === 'blacklist'
                  ? t('dashboard.cardFarming.confirmClearBlacklist.description', {
                      count: blacklist.length,
                    })
                  : t('dashboard.cardFarming.confirmClearQueue.description', {
                      count: queue.length,
                    })}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant='secondary' onPress={() => setConfirmClearTarget(null)}>
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  variant='danger'
                  onPress={() => {
                    if (confirmClearTarget === 'blacklist') {
                      clearBlacklist()
                    } else {
                      reorder([])
                    }
                    setConfirmClearTarget(null)
                  }}
                >
                  {t('common.actions.clear')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  )
}
