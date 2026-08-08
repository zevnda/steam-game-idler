import type { SearchScopeId } from '@/shared/search/scopes'
import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'
import { cn, InputGroup, Modal, Typography } from '@heroui/react'
import { useGamesList } from '@/features/games-list/hooks/useGamesList'
import { GameThumbnail } from '@/shared/components/GameThumbnail'
import { searchGames } from '@/shared/search/fuzzySearch'
import { useSearchStore } from '@/shared/stores/searchStore'

const MAX_LIVE_RESULTS = 8

// One global modal, opened against whichever scope is currently active (see `searchStore`) -
// mirrors the user's own description of `main`'s modal ("a single search bar/modal"), not a
// per-page copy. Unlike `main`'s `SearchModal.tsx`, the input is bound directly to the store's
// query for the active scope (no separate local `inputValue` that has to be kept in sync via an
// effect on open), and typing shows live matched results instead of only setting a filter string
// and closing blind.
export const GlobalSearchModal = () => {
  const { t } = useTranslation()
  const activeScope = useSearchStore(state => state.activeScope)
  const query = useSearchStore(state => (activeScope ? (state.queries[activeScope] ?? '') : ''))
  const setQuery = useSearchStore(state => state.setQuery)
  const close = useSearchStore(state => state.close)
  const recentSearches = useSearchStore(state => state.recentSearches)
  const addRecentSearch = useSearchStore(state => state.addRecentSearch)
  const removeRecentSearch = useSearchStore(state => state.removeRecentSearch)
  const { games } = useGamesList()
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const trimmedQuery = query.trim()

  const results = useMemo(() => {
    if (!activeScope || !trimmedQuery) return []
    // Per-scope data source instead of Step 1's single `if (activeScope === 'games')` - a lookup
    // now that more scopes actually exist. All currently resolve to the same `games` array because
    // favorites/achievement-unlocker/auto-idle/card-farming only filter their "browse" tab (the
    // full owned-games list, same as GamesPage) - their curated list/queue/blacklist tab is
    // deliberately left unfiltered (see FavoritesPage.tsx/AchievementUnlockerPage.tsx/
    // AutoIdlePage.tsx/CardFarmingPage.tsx for why). Card farming's own browse tab actually renders
    // a narrower `GameWithDrops[]` (only games with drops remaining, fetched per-account and held
    // as page-local state, not a global store this always-mounted modal can read), so this live
    // preview intentionally reuses the full owned-games list for it too - close enough for a
    // "suggest a name to search" preview, and avoids either prop-drilling browse state up to the
    // root or triggering a cookie-scrape fetch just to populate a preview. A future scope with its
    // own distinct searchable data would just add its own entry here.
    const scopeDataSources: Record<SearchScopeId, typeof games> = {
      games,
      favorites: games,
      achievementUnlocker: games,
      autoIdle: games,
      cardFarming: games,
    }
    return searchGames(scopeDataSources[activeScope], trimmedQuery).slice(0, MAX_LIVE_RESULTS)
  }, [activeScope, games, trimmedQuery])

  // Whichever list is on-screen right now (live results while typing, else recent searches),
  // reduced to just the string each row would commit - arrow-key navigation and Enter-to-commit
  // both index into this rather than duplicating the trimmedQuery branch. -1 means "nothing
  // highlighted", which falls back to the old behavior of committing the raw typed text on Enter.
  const activeList = trimmedQuery
    ? results.map(game => game.name ?? String(game.appId))
    : recentSearches

  // Re-anchor to "nothing highlighted" whenever the list on screen changes underneath the
  // highlight (new query, scope switch, or a recent search added/removed) - otherwise the index
  // could point at a stale row or go out of bounds.
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [activeScope, trimmedQuery, results, recentSearches])

  // Keyboard-driven highlight moves can land outside the scrollable Modal.Body's viewport (up to
  // 8 results / 10 recent searches vs. a max-h-96 body) - keep the highlighted row in view.
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  useEffect(() => {
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const commit = (value: string) => {
    if (!activeScope) return
    setQuery(activeScope, value)
    addRecentSearch(value)
    close()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (activeList.length === 0) return
      e.preventDefault()
      setHighlightedIndex(prev => {
        if (e.key === 'ArrowDown') return prev >= activeList.length - 1 ? 0 : prev + 1
        return prev <= 0 ? activeList.length - 1 : prev - 1
      })
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < activeList.length) {
      commit(activeList[highlightedIndex])
    } else if (e.key === 'Enter' && trimmedQuery) {
      commit(query)
    } else if (e.key === 'Escape' && query) {
      // Clear the text first, don't close - matching `main`'s escape behavior. Stopping
      // propagation keeps react-aria's own overlay-level Escape-to-dismiss from also firing.
      e.stopPropagation()
      e.preventDefault()
      if (activeScope) setQuery(activeScope, '')
    }
  }

  return (
    <Modal isOpen={activeScope !== null} onOpenChange={open => !open && close()}>
      <Modal.Backdrop>
        <Modal.Container placement='top' size='md'>
          <Modal.Dialog className='mt-6' style={{ padding: 0 }}>
            <Modal.Header className='border-b border-border p-2'>
              <InputGroup
                className={cn(
                  'min-h-20 w-full rounded-none border-none! bg-transparent! shadow-none',
                  'hover:bg-transparent! focus-within:bg-transparent!',
                )}
              >
                <InputGroup.Prefix className='border-none! bg-transparent!'>
                  <RiSearchLine className='text-muted' fontSize={22} />
                </InputGroup.Prefix>
                <InputGroup.Input
                  autoFocus
                  className='text-lg placeholder:text-lg'
                  placeholder={t('common.search.placeholder')}
                  value={query}
                  onChange={e => activeScope && setQuery(activeScope, e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {query && (
                  <InputGroup.Suffix className='border-none! bg-transparent!'>
                    <button
                      type='button'
                      onClick={() => activeScope && setQuery(activeScope, '')}
                      className='cursor-pointer'
                    >
                      <TbX fontSize={16} />
                    </button>
                  </InputGroup.Suffix>
                )}
              </InputGroup>
            </Modal.Header>

            <Modal.Body className='max-h-96 overflow-y-auto p-2'>
              {trimmedQuery ? (
                results.length > 0 ? (
                  <div className='flex flex-col gap-0.5 p-2'>
                    {results.map((game, index) => (
                      <button
                        key={game.appId}
                        ref={el => {
                          itemRefs.current[index] = el
                        }}
                        className={cn(
                          'flex items-center gap-3 rounded-lg p-2 text-left hover:bg-surface-hover cursor-pointer',
                          index === highlightedIndex && 'bg-surface-hover',
                        )}
                        type='button'
                        onClick={() => commit(game.name ?? String(game.appId))}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className='h-10 w-20 shrink-0'>
                          <GameThumbnail
                            appId={game.appId}
                            name={game.name ?? String(game.appId)}
                          />
                        </div>
                        <Typography className='truncate' type='body-sm'>
                          {game.name ?? t('dashboard.games.unknownName', { appId: game.appId })}
                        </Typography>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className='flex flex-col items-center gap-2 p-8 text-center'>
                    <RiSearchLine className='text-muted' fontSize={28} />
                    <Typography color='muted' type='body-sm'>
                      {t('common.search.noResults')}
                    </Typography>
                  </div>
                )
              ) : recentSearches.length > 0 ? (
                <div className='flex flex-col gap-0.5 p-2'>
                  <Typography
                    className='px-2 pb-1 pt-2'
                    color='muted'
                    type='body-xs'
                    weight='semibold'
                  >
                    {t('common.search.recentSearches')}
                  </Typography>
                  {recentSearches.map((recent, index) => (
                    <div className='flex items-center gap-1' key={recent}>
                      <button
                        ref={el => {
                          itemRefs.current[index] = el
                        }}
                        className={cn(
                          'flex-1 truncate rounded-lg p-2 text-left text-sm hover:bg-surface-hover cursor-pointer',
                          index === highlightedIndex && 'bg-surface-hover',
                        )}
                        type='button'
                        onClick={() => commit(recent)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {recent}
                      </button>
                      <button
                        aria-label={`Remove "${recent}" from recent searches`}
                        className='shrink-0 rounded-full p-1 hover:bg-surface-hover cursor-pointer'
                        type='button'
                        onClick={() => removeRecentSearch(recent)}
                      >
                        <TbX fontSize={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center gap-2 p-8 text-center'>
                  <RiSearchLine className='text-muted' fontSize={28} />
                  <Typography color='muted' type='body-sm'>
                    {t('common.search.noRecentSearches')}
                  </Typography>
                </div>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
