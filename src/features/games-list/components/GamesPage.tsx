import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbDeviceGamepad2 } from 'react-icons/tb'
import { useGamesList } from '../hooks/useGamesList'
import { errorMessageKey } from '../utils/errorMessageKey'
import { GamesList } from './GamesList'
import { GamesPageHeader } from './GamesPageHeader'
import { Alert, Button, EmptyState, Typography } from '@heroui/react'
import { useRouter } from 'next/router'
import { useIdling } from '@/features/idling/hooks/useIdling'
import { GameGridSkeleton } from '@/shared/components/GameGridSkeleton'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useCarouselSettingsStore } from '@/shared/stores/carouselSettingsStore'
import { useSearchStore } from '@/shared/stores/searchStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'
import { openExternalLink } from '@/shared/utils/links'
import { sortOwnedGames } from '@/shared/utils/sortOwnedGames'

const STEAM_PRIVACY_SETTINGS_URL = 'https://steamcommunity.com/my/edit/settings'

// Default landing page after sign-in. Renders the
// merged `OwnedGame[]` from the games backend via `useGamesList` - cache-first for
// local-mode accounts, then a background refresh. Also owns idling's start/stop toggle (see
// GameCard) - the idling feature's own page is now just a filtered, view-only list of whatever
// this page's toggles started, mirroring `main`'s split between the two pages.
export const GamesPage = () => {
  const { t } = useTranslation()
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
  const sortedFilteredGames = useMemo(
    () => sortOwnedGames(filteredGames, sortStyle),
    [filteredGames, sortStyle],
  )

  // A manual refresh replaces the whole page with the skeleton again (real, visible feedback that
  // the click did something), unlike the silent staleness/background refreshes `useGamesListSync`
  // drives - see `useGamesList`'s doc comment on why `isManualRefreshing` is scoped to this
  // component's own trigger, not the store's general `isRefreshing`.
  const showSkeleton = phase === 'loading' || isManualRefreshing

  const showRecommendedCarousel = useCarouselSettingsStore(state => state.showRecommended)
  const showRecentCarousel = useCarouselSettingsStore(state => state.showRecent)
  // Independent of `searchQuery`/`filteredGames` - these are a discovery surface, not the searched
  // list itself (mirrors `main`'s own carousels, which never read its search state either). Capped
  // at 20/15 respectively so a large library still renders a bounded-length carousel without
  // needing `VirtualizedGameGrid`'s own virtualization (see `GameCarousel`'s doc comment).
  const recommendedGames = useMemo(
    () => games.filter(game => game.playtimeForeverMinutes === 0).slice(0, 20),
    [games],
  )
  const recentGames = useMemo(
    () =>
      games
        .filter(game => game.rtimeLastPlayed > 0)
        .sort((a, b) => b.rtimeLastPlayed - a.rtimeLastPlayed)
        .slice(0, 15),
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

  return (
    <div className='flex h-full flex-col'>
      <GamesPageHeader
        gameCount={games.length}
        isRefreshing={isRefreshing}
        sortStyle={sortStyle}
        onRefresh={refresh}
        onSortStyleChange={style => setSortStyle('games', style)}
      />

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

      {showSkeleton ? (
        <GameGridSkeleton />
      ) : errorCode ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
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
            recentGames={recentGames}
            recommendedGames={recommendedGames}
            showRecentCarousel={showRecentCarousel}
            showRecommendedCarousel={showRecommendedCarousel}
            onToggleIdle={toggleIdle}
          />
        </div>
      )}
    </div>
  )
}
