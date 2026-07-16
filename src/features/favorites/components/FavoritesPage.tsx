import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbDeviceGamepad2, TbHeart } from 'react-icons/tb'
import { useFavorites } from '../hooks/useFavorites'
import { errorMessageKey as favoritesErrorMessageKey } from '../utils/errorMessageKey'
import { FavoritesBrowseGrid } from './FavoritesBrowseGrid'
import { FavoritesListGrid } from './FavoritesListGrid'
import { FavoritesPageHeader } from './FavoritesPageHeader'
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
import { useSearchStore } from '@/shared/stores/searchStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'
import {
  OWNED_GAME_SORT_LABEL_KEYS,
  OWNED_GAME_SORT_STYLES,
  sortOwnedGames,
} from '@/shared/utils/sortOwnedGames'

type FavoritesTab = 'browse' | 'list'

// Global search filters only the "browse" tab's `games` array - the same array/mechanism
// GamesPage.tsx already wires. The "list" tab is deliberately
// left unfiltered: FavoritesListGrid's `onReorder` replaces the *entire* persisted favorites order
// (`set_favorites_order`), so wiring a filtered subset in as its `favorites` prop would mean
// dragging while a search is active silently drops every currently filtered-out favorite from the
// saved order on the next reorder - a real data-loss bug, not just a cosmetic gap. The list is
// also inherently small/bounded (a curated favorites list, not the full owned-games library) -
// this same tab is already exempt from virtualization for the analogous "small, and fights
// @dnd-kit's need for every item mounted" reasoning, which extends naturally to skipping
// filtering here too.
export const FavoritesPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const account = useSessionStore(state => state.account)
  const { phase, games, errorCode: gamesErrorCode, refresh } = useGamesList()
  const {
    favorites,
    isLoading: favoritesLoading,
    errorCode: favoritesErrorCode,
    pendingAppIds,
    addFavorite,
    removeFavorite,
    reorder,
    toggleFavorite,
  } = useFavorites()
  const [activeTab, setActiveTab] = useState<FavoritesTab>('browse')
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [isManualAddOpen, setIsManualAddOpen] = useState(false)
  const searchQuery = useSearchStore(state => state.queries.favorites ?? '')
  const setActiveTabSearchable = useSearchStore(state => state.setActiveTabSearchable)
  const filteredGames = useMemo(() => searchGames(games, searchQuery), [games, searchQuery])
  // Persisted across navigation/reload/restart via `sortPreferencesStore` (localStorage) - see
  // GamesPage.tsx's identical wiring.
  const sortStyle = useSortPreferencesStore(state => state.favorites)
  const setSortStyle = useSortPreferencesStore(state => state.setSortPreference)
  const sortedFilteredGames = useMemo(
    () => sortOwnedGames(filteredGames, sortStyle),
    [filteredGames, sortStyle],
  )

  const favoritedAppIds = useMemo(() => new Set(favorites.map(f => f.appId)), [favorites])

  useEffect(() => {
    if (!account) {
      router.replace('/')
    }
  }, [account, router])

  // Search only filters the "browse" tab (see the file-level comment above) - hide the titlebar
  // affordance entirely while on the unfiltered "list" tab rather than leave it visibly present
  // but silently inert. Resets back to `true` on unmount so navigating away doesn't leave search
  // hidden elsewhere.
  useEffect(() => {
    setActiveTabSearchable(activeTab === 'browse')
    return () => setActiveTabSearchable(true)
  }, [activeTab, setActiveTabSearchable])

  if (!account) {
    return null
  }

  return (
    <div className='flex h-full flex-col'>
      <FavoritesPageHeader
        favoriteCount={favorites.length}
        onManualAdd={() => setIsManualAddOpen(true)}
      />

      {favoritesErrorCode && (
        <div className='px-6 pt-4'>
          <Alert status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('dashboard.favorites.errors.title')}</Alert.Title>
              <Alert.Description>
                {t(favoritesErrorMessageKey(favoritesErrorCode), { code: favoritesErrorCode })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      <TabsRoot
        className='flex min-h-0 flex-1 flex-col'
        selectedKey={activeTab}
        onSelectionChange={key => setActiveTab(key as FavoritesTab)}
      >
        <div className='mx-6 mt-4 flex items-center justify-between gap-3'>
          <TabListContainer className='shrink-0'>
            <TabList>
              <Tab className='whitespace-nowrap' id='browse'>
                {t('common.tabs.allGames')}
                <TabIndicator />
              </Tab>
              <Tab className='whitespace-nowrap' id='list'>
                {t('dashboard.sidebar.nav.favorites')}
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
              onChange={style => setSortStyle('favorites', style)}
            />
          )}
          {activeTab === 'list' && favorites.length > 0 && (
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
            <FavoritesBrowseGrid
              favoritedAppIds={favoritedAppIds}
              games={sortedFilteredGames}
              pendingAppIds={pendingAppIds}
              onToggle={game => toggleFavorite(game.appId, game.name ?? String(game.appId))}
            />
          )}
        </TabPanel>

        <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='list'>
          {favoritesLoading ? (
            <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className='aspect-460/215 rounded-lg' />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
              <TbHeart fontSize={40} />
              <Typography type='h3'>{t('dashboard.favorites.empty.title')}</Typography>
              <Typography color='muted' type='body-sm'>
                {t('dashboard.favorites.empty.description')}
              </Typography>
            </EmptyState>
          ) : (
            <FavoritesListGrid
              favorites={favorites}
              pendingAppIds={pendingAppIds}
              onRemove={removeFavorite}
              onReorder={reorder}
            />
          )}
        </TabPanel>
      </TabsRoot>

      <AlertDialog isOpen={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.favorites.confirmClear.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.favorites.confirmClear.description', { count: favorites.length })}
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
        existingAppIds={favorites.map(f => f.appId)}
        isOpen={isManualAddOpen}
        onAdd={addFavorite}
        onOpenChange={setIsManualAddOpen}
      />
    </div>
  )
}
