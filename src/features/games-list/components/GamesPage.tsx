import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbRefresh } from 'react-icons/tb'
import { useGamesList } from '../hooks/useGamesList'
import { errorMessageKey } from '../utils/errorMessageKey'
import { GamesList } from './GamesList'
import { NoGamesBanner } from './NoGamesBanner'
import { Alert, Button, EmptyState, Skeleton, Typography } from '@heroui/react'
import { useRouter } from 'next/router'
import { useIdling } from '@/features/idling/hooks/useIdling'
import { PageBannerArea } from '@/shared/components/dashboard/PageBanner'
import { PageBody } from '@/shared/components/dashboard/PageBody'
import { PageTitle, PageToolbar } from '@/shared/components/dashboard/PageToolbar'
import { GameGridSkeleton } from '@/shared/components/GameGridSkeleton'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { useOwnedGameSort } from '@/shared/hooks/useOwnedGameSort'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useSearchStore } from '@/shared/stores/searchStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'
import { openExternalLink } from '@/shared/utils/links'
import { OWNED_GAME_SORT_LABEL_KEYS, sortOwnedGames } from '@/shared/utils/sortOwnedGames'

const STEAM_PRIVACY_SETTINGS_URL = 'https://steamcommunity.com/my/edit/settings'

// Default landing page after sign-in. Renders the
// merged `OwnedGame[]` from the games backend via `useGamesList` - cache-first for
// local-mode accounts, then a background refresh. Also owns idling's start/stop toggle (see
// GameCard) - the idling feature's own page is now just a filtered, view-only list of whatever
// this page's toggles started, mirroring `main`'s split between the two pages.
export const GamesPage = () => {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const account = useSessionStore(state => state.account)
  const { phase, games, isRefreshing, isManualRefreshing, errorCode, possiblyPrivate, refresh } =
    useGamesList()
  const {
    appIds: idlingAppIds,
    startTimes: idleStartTimes,
    pendingAppIds: idlePendingAppIds,
    toggleIdle,
  } = useIdling(games)
  // `useIdling` above still gets the *full* `games` array (it needs every owned game's name to
  // build `set_idle_games`' name lookup, not just what's currently visible) - only what's rendered
  // in `GamesList` is filtered.
  const searchQuery = useSearchStore(state => state.queries.games ?? '')
  const filteredGames = useMemo(() => searchGames(games, searchQuery), [games, searchQuery])
  // Defaults to highest-playtime-first (matches `main`'s own default) - persisted across
  // navigation/reload/restart via `sortPreferencesStore` (localStorage), hydrated once by
  // `useSortPreferencesSync` in DashboardShell.
  const sortStyle = useSortPreferencesStore(state => state.games)
  const setSortStyle = useSortPreferencesStore(state => state.setSortPreference)
  const { options: sortStyleOptions, effectiveStyle: effectiveSortStyle } =
    useOwnedGameSort(sortStyle)
  const sortedFilteredGames = useMemo(
    () => sortOwnedGames(filteredGames, effectiveSortStyle, i18n.language),
    [filteredGames, effectiveSortStyle, i18n.language],
  )

  // A manual refresh replaces the whole page with the skeleton again (real, visible feedback that
  // the click did something), unlike the silent staleness/background refreshes `useGamesListSync`
  // drives - see `useGamesList`'s doc comment on why `isManualRefreshing` is scoped to this
  // component's own trigger, not the store's general `isRefreshing`.
  const showSkeleton = phase === 'loading' || isManualRefreshing

  // Independent of `searchQuery`/`filteredGames` - this is a discovery surface, not the searched
  // list itself. Capped so `useRecommendedSlides` has a bounded set of candidates to check.
  const recommendedGames = useMemo(
    () => games.filter(game => game.playtimeForeverMinutes === 0).slice(0, 20),
    [games],
  )

  useEffect(() => {
    // Nothing yet persists "who's signed in" across a page load that didn't just come from a
    // sign-in flow (see sessionStore's doc comment) - without an account there's nothing this
    // page can fetch, so send the user
    // back to sign in rather than rendering a page that can only ever show a loading spinner.
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  if (!account) {
    return null
  }

  const errorAlert = errorCode && (
    <>
      <Alert className='max-w-md' status='danger'>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t('dashboard.games.errors.title')}</Alert.Title>
          <Alert.Description>
            {t(errorMessageKey(errorCode), { code: errorCode })}
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <Button variant='secondary' onPress={refresh}>
        {t('common.actions.tryAgain')}
      </Button>
    </>
  )

  // `GamesList` draws the toolbar itself while the list is showing, so it can sit under the banner.
  const isShowingList = !showSkeleton && games.length > 0 && filteredGames.length > 0
  const renderToolbar = (isFrosted: boolean) => (
    <PageToolbar
      isFrosted={isFrosted}
      start={
        isShowingList && (
          <PageTitle count={filteredGames.length} title={t('common.tabs.allGames')} />
        )
      }
    >
      <GameSortSelect
        isDisabled={!isShowingList}
        ariaLabel={t('dashboard.inventoryManager.sort.label')}
        options={sortStyleOptions.map(style => ({
          id: style,
          label: t(OWNED_GAME_SORT_LABEL_KEYS[style]),
        }))}
        value={effectiveSortStyle}
        onChange={style => setSortStyle('games', style)}
      />
      <Button
        isIconOnly
        aria-label={t('common.actions.refresh')}
        isPending={isRefreshing}
        onPress={refresh}
      >
        <TbRefresh fontSize={18} />
      </Button>
    </PageToolbar>
  )
  return (
    <div className='flex h-full flex-col'>
      <PageBody>
        {/* A failed refresh with a list already loaded only earns a notice: the games on screen are
            still correct, and replacing them would make a brief Steam stall look like a lost
            library. */}
        {!showSkeleton && errorCode && games.length > 0 && (
          <div className='px-6 py-4'>{errorAlert}</div>
        )}

        {!showSkeleton && !errorCode && possiblyPrivate && (
          <div className='px-6 py-4'>
            <Alert status='warning'>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('dashboard.games.privacyWarning.title')}</Alert.Title>
                <Alert.Description>
                  {t('dashboard.games.privacyWarning.description')}
                </Alert.Description>
              </Alert.Content>
              <div className='flex shrink-0 gap-2'>
                <Button
                  size='sm'
                  variant='secondary'
                  onPress={() => openExternalLink(STEAM_PRIVACY_SETTINGS_URL)}
                >
                  {t('dashboard.games.privacyWarning.changeSettings')}
                </Button>
                <Button
                  size='sm'
                  variant='secondary'
                  onPress={() => useSettingsModalStore.getState().open('general')}
                >
                  {t('dashboard.games.privacyWarning.useOwnKey')}
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {/* Sized by the same limits as GamesList's banner row, so the banner replaces this without
            the page moving. On a refresh the games are already known, so a library with nothing to
            recommend doesn't flash a banner it will never show. */}
        {showSkeleton && (games.length === 0 || recommendedGames.length > 0) && (
          <div className='shrink-0 px-6 pt-3.5'>
            <Skeleton className='aspect-1920/620 max-h-105 min-h-85 w-full rounded-2xl' />
          </div>
        )}

        {!isShowingList && renderToolbar(!showSkeleton)}

        {showSkeleton ? (
          <GameGridSkeleton />
        ) : errorCode && games.length === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
            {errorAlert}
          </div>
        ) : games.length === 0 ? (
          <PageBannerArea hasToolbar>
            <NoGamesBanner isRefreshing={isRefreshing} onRefresh={refresh} />
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
          // `overflow-hidden`, not `-auto` - GamesList is now a virtualized list that scrolls
          // internally (react-window's List owns its own scroll container, and the carousels are
          // rows within it - see GamesList.tsx), this wrapper just needs to give it a definite
          // height to fill.
          <div className='flex-1 overflow-hidden'>
            <GamesList
              games={sortedFilteredGames}
              idlePendingAppIds={idlePendingAppIds}
              idleStartTimes={idleStartTimes}
              idlingAppIds={idlingAppIds}
              recommendedGames={recommendedGames}
              toolbar={renderToolbar(false)}
              onToggleIdle={toggleIdle}
            />
          </div>
        )}
      </PageBody>
    </div>
  )
}
