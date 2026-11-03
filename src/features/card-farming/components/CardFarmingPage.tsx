import type { CardFarmingSettings, GameWithDrops } from '../types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbPlayerPlayFilled, TbPlayerStopFilled, TbSettings } from 'react-icons/tb'
import { useCardFarming } from '../hooks/useCardFarming'
import { useCardFarmingBlacklist } from '../hooks/useCardFarmingBlacklist'
import { useCardFarmingWhitelist } from '../hooks/useCardFarmingWhitelist'
import { errorMessageKey } from '../utils/errorMessageKey'
import {
  CARD_FARMING_SORT_LABEL_KEYS,
  CARD_FARMING_SORT_STYLES,
  sortGamesWithDrops,
} from '../utils/sortGamesWithDrops'
import { CardFarmingBlacklistGrid } from './CardFarmingBlacklistGrid'
import { CardFarmingBrowseGrid } from './CardFarmingBrowseGrid'
import { CardFarmingEmptyBanner } from './CardFarmingEmptyBanner'
import { CardFarmingProgressView } from './CardFarmingProgressView'
import { CardFarmingStartPanel } from './CardFarmingStartPanel'
import { CardFarmingWhitelistGrid } from './CardFarmingWhitelistGrid'
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
  TabsRoot,
  Typography,
} from '@heroui/react'
import { useRouter } from 'next/router'
import { PageBannerArea } from '@/shared/components/dashboard/PageBanner'
import { PageBody } from '@/shared/components/dashboard/PageBody'
import { CountChip, PageToolbar } from '@/shared/components/dashboard/PageToolbar'
import { GameGridSkeleton } from '@/shared/components/GameGridSkeleton'
import { GameListTabPanel } from '@/shared/components/GameListTabPanel'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { useAutoConnectSteamCookies } from '@/shared/hooks/useAutoConnectSteamCookies'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useSearchStore } from '@/shared/stores/searchStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'
import { invoke } from '@/shared/utils/invoke'

type CardFarmingTab = 'browse' | 'whitelist' | 'blacklist'

// Card drops remaining are detected via cookie-authenticated Steam Community scraping, unrelated
// to either sign-in backend's own session - both agent and local mode farm identically once a
// SteamID64 is resolved. Mirrors AchievementUnlockerPage's browse/queue two-tab shape, extended to
// three (browse/whitelist/blacklist - see `card_farming::whitelist`'s doc comment for why the
// whitelist is a scope list, not an ordered queue). The progress view stays up past `isFarming`
// flipping false whenever the just-ended cycle left a `completed` summary worth showing
// (`showFinishedSummary` below) - dismissed explicitly via `CardFarmingProgressView`'s "Done"
// button, or implicitly by starting a new cycle (`cardFarmingStore`'s `dismissedFinished` resets on
// the next `isFarming: true` update) - rather than yanked away the instant `isFarming` flips, which
// would make actual results (cards farmed, games maxed out) flash by unseen.
//
// `useCardFarmingSync` (mounted in DashboardShell, not here) is what makes a running cycle survive
// navigating away from this page and back - this component only reads the store it keeps current.
//
// A third "Blacklisted" tab (`useCardFarmingBlacklist`) replaces `main`'s custom-lists-based
// blacklist management screen - blacklisting happens via a ban button on each browse card, and only
// un-blacklisting happens from this tab. `handleBlacklist` removes the game from both `browseGames`
// (optimistic) and the whitelist if it happened to be a member; the backend's own commands also
// filter blacklisted app IDs as a defense-in-depth backstop. `handleUnblacklist` re-scrapes via
// `refreshBrowse` instead of an optimistic local add, since a blacklist entry doesn't carry the
// fields a browse card needs.
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
  const openSettings = useSettingsModalStore(state => state.open)
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
    blacklistedDropGames,
    isBrowseLoading,
    removeBrowseGame,
    refreshBrowse,
    connect,
    start,
    stop,
  } = useCardFarming()
  const {
    whitelist,
    isLoading: whitelistLoading,
    pendingAppIds,
    removeFromWhitelist,
    clearWhitelist,
    toggleWhitelisted,
    refresh: refreshWhitelist,
  } = useCardFarmingWhitelist()
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
  // Shared by the whitelist and blacklist tabs' "Clear" actions - each tab clears a different list,
  // so this tracks which one the open dialog is confirming rather than duplicating the dialog itself.
  const [confirmClearTarget, setConfirmClearTarget] = useState<'whitelist' | 'blacklist' | null>(
    null,
  )
  // Only used to label CardFarmingProgressView's queue rows ("accumulating" vs "waiting its turn")
  // - a passive display concern, not something Start/farming logic needs, since scope/phase
  // resolution is entirely backend-internal now (see `card_farming::manager`'s module doc comment).
  const [hoursUntilFarmable, setHoursUntilFarmable] = useState<number | undefined>(undefined)
  // Global search filters only the "browse" tab's `browseGames` array - mirrors FavoritesPage's/
  // AchievementUnlockerPage's browse-tab-only wiring.
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
  const whitelistedAppIds = useMemo(() => new Set(whitelist.map(game => game.appId)), [whitelist])
  const dropsByAppId = useMemo(
    () => new Map([...browseGames, ...blacklistedDropGames].map(game => [game.appId, game])),
    [browseGames, blacklistedDropGames],
  )
  // Connect-time failures (a bad cookie paste, or the connect panel's own automatic-path failure)
  // render inline inside CardFarmingStartPanel's errorSlot instead - see that component's doc
  // comment - so this page-level banner only needs to cover errors reachable while already
  // connected: start/stop failures, plus refreshBrowse's rare non-session failure edge case (see
  // useCardFarming's connect/refreshBrowse doc comments). Gated on `connected`, mirroring
  // InventoryManagerPage's `canAccessInventory && errorCode` banner, so this never overlaps with
  // the connect panel's own inline error.
  const displayedErrorCode = errorCode ?? connectErrorCode
  const showFinishedSummary = !state.isFarming && !dismissedFinished && state.completed.length > 0

  useEffect(() => {
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  const refreshHoursUntilFarmable = useCallback(async () => {
    if (!account) return
    try {
      const settings = await invoke<CardFarmingSettings>('get_card_farming_settings', { account })
      setHoursUntilFarmable(settings.hoursUntilFarmable)
    } catch (error) {
      console.error('Error in (get_card_farming_settings):', error)
    }
  }, [account])

  useEffect(() => {
    refreshHoursUntilFarmable()
  }, [refreshHoursUntilFarmable])

  // The Settings modal is an overlay (see useSettingsModalStore's doc comment), not a route change,
  // so this page never remounts while it's open - re-read the threshold on the falling edge (modal
  // just closed), mirroring InventoryManagerPage's identical wiring, so a change saved from the
  // modal is reflected immediately in the queue-row labels.
  const isSettingsModalOpen = useSettingsModalStore(state => state.isOpen)
  const wasSettingsModalOpenRef = useRef(false)
  useEffect(() => {
    if (wasSettingsModalOpenRef.current && !isSettingsModalOpen) {
      refreshHoursUntilFarmable()
    }
    wasSettingsModalOpenRef.current = isSettingsModalOpen
  }, [isSettingsModalOpen, refreshHoursUntilFarmable])

  // See this component's doc comment for why blacklisting also cleans up `browseGames`/`whitelist`
  // locally rather than waiting on a refetch.
  const handleBlacklist = async (game: GameWithDrops) => {
    await addToBlacklist({ appId: game.appId, name: game.name })
    removeBrowseGame(game.appId)
    if (whitelistedAppIds.has(game.appId)) {
      await removeFromWhitelist(game.appId)
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

  // A farming cycle auto-prunes the whitelist as games become ineligible (see
  // `card_farming::manager::resolve_candidates`'s doc comment), but `FarmingState`'s change event
  // doesn't carry the persisted whitelist - so this local copy otherwise goes stale mid-run/at
  // run-end. Refetch on the farming->stopped edge (covers both a full cycle completing and a manual
  // stop) - but that edge alone misses a cycle that starts and fully resolves (nothing eligible at
  // all) before the backend ever emits an intermediate `isFarming: true` state: the frontend then
  // only ever observes the single terminal event, so `isFarming` goes false->false and no edge
  // fires. `state.completed` growing is the more reliable signal (it's exactly what a prune
  // produces), so either condition triggers a refetch. Mirrors AchievementUnlockerPage's
  // `wasRunning` transition effect, extended for this fast-cycle case.
  const wasFarming = useRef(state.isFarming)
  const prevCompletedCount = useRef(state.completed.length)
  useEffect(() => {
    if (
      (wasFarming.current && !state.isFarming) ||
      state.completed.length > prevCompletedCount.current
    ) {
      refreshWhitelist()
    }
    wasFarming.current = state.isFarming
    prevCompletedCount.current = state.completed.length
  }, [state.isFarming, state.completed.length, refreshWhitelist])

  // Search only filters the "browse" tab (see the wiring comment above) - hide the titlebar
  // affordance entirely while on the unfiltered whitelist/blacklist tabs, while a farming cycle is
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

  const isShowingProgress = state.isFarming || showFinishedSummary
  // The tabs stay on screen in every state so this row never changes shape: disabled while loading,
  // while there's no Steam session to load anything with, and during a run.
  const isShowingTabs = connected && !isShowingProgress && !isChecking && !isAutoConnecting
  const isShowingConnectPanel = !connected && !isShowingProgress && !isChecking && !isAutoConnecting
  const pageActions = (
    <>
      <Button
        isIconOnly
        aria-label={t('common.actions.settings')}
        onPress={() => openSettings('cardFarming')}
      >
        <TbSettings fontSize={18} />
      </Button>
      {isShowingConnectPanel ? null : state.isFarming ? (
        <Button isPending={isStopping} variant='danger' onPress={handleStop}>
          <TbPlayerStopFilled fontSize={18} />
          {t('dashboard.cardFarming.actions.stop')}
        </Button>
      ) : (
        <Button
          isDisabled={
            !connected ||
            isChecking ||
            isAutoConnecting ||
            (!isBrowseLoading && browseGames.length === 0)
          }
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
        {connected && displayedErrorCode && (
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

        {/* The connect panel renders outside this TabsRoot (see below): its own Automatic/Manual
            tabs, nested in here, were picked up as this page's tabs and drawn in the toolbar. */}
        <TabsRoot
          isDisabled={!isShowingTabs}
          className={cn('flex flex-col', !isShowingConnectPanel && 'min-h-0 flex-1')}
          selectedKey={activeTab}
          onSelectionChange={key => setActiveTab(key as CardFarmingTab)}
        >
          {/* Hidden, not unmounted, while the credentials prompt shows: nothing in it can be used
              yet (the prompt has its own settings button), and the page's tab state needs its tab
              list to stay registered. */}
          <div className={cn(isShowingConnectPanel && 'hidden')}>
            <PageToolbar
              start={
                <TabListContainer className='shrink-0'>
                  <TabList>
                    <Tab className='gap-2 whitespace-nowrap' id='browse'>
                      {t('dashboard.cardFarming.tabs.gamesWithDrops')}
                      {isShowingTabs && !isBrowseLoading && (
                        <CountChip count={browseGames.length} />
                      )}
                      <TabIndicator />
                    </Tab>
                    <Tab className='gap-2 whitespace-nowrap' id='whitelist'>
                      {t('dashboard.cardFarming.tabs.whitelisted')}
                      {isShowingTabs && !whitelistLoading && <CountChip count={whitelist.length} />}
                      <TabIndicator />
                    </Tab>
                    <Tab className='gap-2 whitespace-nowrap' id='blacklist'>
                      {t('dashboard.cardFarming.tabs.blacklisted')}
                      {isShowingTabs && !blacklistLoading && <CountChip count={blacklist.length} />}
                      <TabIndicator />
                    </Tab>
                  </TabList>
                </TabListContainer>
              }
            >
              {activeTab === 'browse' && !isShowingConnectPanel && (
                <GameSortSelect
                  isDisabled={!isShowingTabs || browseGames.length === 0}
                  ariaLabel={t('dashboard.inventoryManager.sort.label')}
                  options={CARD_FARMING_SORT_STYLES.map(style => ({
                    id: style,
                    label: t(CARD_FARMING_SORT_LABEL_KEYS[style]),
                  }))}
                  value={sortStyle}
                  onChange={style => setSortStyle('cardFarming', style)}
                />
              )}
              {activeTab === 'whitelist' && whitelist.length > 0 && (
                <Button
                  className='shrink-0'
                  isDisabled={!isShowingTabs}
                  variant='danger'
                  onPress={() => setConfirmClearTarget('whitelist')}
                >
                  {t('common.actions.clear')}
                </Button>
              )}
              {activeTab === 'blacklist' && blacklist.length > 0 && (
                <Button
                  className='shrink-0'
                  isDisabled={!isShowingTabs}
                  variant='danger'
                  onPress={() => setConfirmClearTarget('blacklist')}
                >
                  {t('common.actions.clear')}
                </Button>
              )}
              {pageActions}
            </PageToolbar>
          </div>

          {isShowingProgress ? (
            <div className='min-h-0 flex-1 overflow-y-auto'>
              <CardFarmingProgressView
                hoursUntilFarmable={hoursUntilFarmable}
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
          ) : isShowingConnectPanel ? null : (
            <>
              <GameListTabPanel id='browse'>
                {isBrowseLoading ? (
                  <GameGridSkeleton />
                ) : browseGames.length === 0 ? (
                  <PageBannerArea hasToolbar>
                    <CardFarmingEmptyBanner
                      variant='browse'
                      onBrowseGames={() => setActiveTab('browse')}
                    />
                  </PageBannerArea>
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
                    whitelistedAppIds={whitelistedAppIds}
                    onBlacklist={handleBlacklist}
                    onToggleWhitelist={game => toggleWhitelisted(game.appId, game.name)}
                  />
                )}
              </GameListTabPanel>

              <GameListTabPanel id='whitelist'>
                {whitelistLoading ? (
                  <GameGridSkeleton />
                ) : whitelist.length === 0 ? (
                  <PageBannerArea hasToolbar>
                    <CardFarmingEmptyBanner
                      variant='whitelist'
                      onBrowseGames={() => setActiveTab('browse')}
                    />
                  </PageBannerArea>
                ) : (
                  <CardFarmingWhitelistGrid
                    dropsByAppId={dropsByAppId}
                    pendingAppIds={pendingAppIds}
                    whitelist={whitelist}
                    onRemove={removeFromWhitelist}
                  />
                )}
              </GameListTabPanel>

              <GameListTabPanel id='blacklist'>
                {blacklistLoading ? (
                  <GameGridSkeleton />
                ) : blacklist.length === 0 ? (
                  <PageBannerArea hasToolbar>
                    <CardFarmingEmptyBanner
                      variant='blacklist'
                      onBrowseGames={() => setActiveTab('browse')}
                    />
                  </PageBannerArea>
                ) : (
                  <CardFarmingBlacklistGrid
                    dropsByAppId={dropsByAppId}
                    blacklist={blacklist}
                    pendingAppIds={pendingBlacklistAppIds}
                    onRemove={handleUnblacklist}
                  />
                )}
              </GameListTabPanel>
            </>
          )}
        </TabsRoot>

        {isShowingConnectPanel && (
          <CardFarmingStartPanel
            errorCode={connectErrorCode}
            isConnecting={isConnecting}
            onConnect={connect}
            onOpenSettings={() => openSettings('cardFarming')}
          />
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
                      : t('dashboard.cardFarming.confirmClearWhitelist.title')}
                  </AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  {confirmClearTarget === 'blacklist'
                    ? t('dashboard.cardFarming.confirmClearBlacklist.description', {
                        count: blacklist.length,
                      })
                    : t('dashboard.cardFarming.confirmClearWhitelist.description', {
                        count: whitelist.length,
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
                        clearWhitelist()
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
      </PageBody>
    </div>
  )
}
