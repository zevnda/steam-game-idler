import type { Game, InvokeGamesList, SortStyleValue } from '@/shared/types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showDangerToast } from '@/shared/components'
import { useSearchStore, useUserStore } from '@/shared/stores'
import { decrypt, invokeSafe, logEvent } from '@/shared/utils'

export function useGamesList() {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const gamesList = useUserStore(state => state.gamesList)
  const setGamesList = useUserStore(state => state.setGamesList)
  const isQuery = useSearchStore(state => state.isQuery)
  const gameQueryValue = useSearchStore(state => state.gameQueryValue)
  const setGameQueryValue = useSearchStore(state => state.setGameQueryValue)
  const [isLoading, setIsLoading] = useState(true)
  const [recentGames, setRecentGames] = useState<Game[] | null>(null)
  const [unplayedGames, setUnplayedGames] = useState<Game[]>([])
  const [sortStyle, setSortStyle] = useState<SortStyleValue>(
    (localStorage.getItem('sortStyle') as SortStyleValue) || '1-0',
  )
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [visibleGames, setVisibleGames] = useState<Game[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const previousRefreshKeyRef = useRef(refreshKey)

  useEffect(() => {
    const getGamesList = async () => {
      try {
        setIsLoading(true)
        const sortStyle = localStorage.getItem('sortStyle')
        if (sortStyle) setSortStyle(sortStyle)

        // Fetch games data, either from cache or API
        const { gamesList, recentGamesList } = await fetchGamesList(
          userSummary?.steamId,
          refreshKey,
          previousRefreshKeyRef.current,
          userSettings.general?.apiKey || undefined,
        )
        setGamesList(gamesList)
        setRecentGames(recentGamesList)

        // Get random unplayed games
        const unplayed = gamesList.filter(game => (game.playtime_forever ?? 0) === 0)
        const randomUnplayed = getRandomGames(unplayed, 10)
        setUnplayedGames(randomUnplayed)

        setIsLoading(false)
        previousRefreshKeyRef.current = refreshKey
      } catch (error) {
        setIsLoading(false)
        showDangerToast(t('common.error'))
        console.error('Error in (getGamesList):', error)
        logEvent(`[Error] in (getGamesList): ${error}`)
      }
    }
    getGamesList()

    return () => {
      setRecentGames(null)
      setUnplayedGames([])
      setFilteredGames([])
      setVisibleGames([])
    }
  }, [userSummary?.steamId, userSettings.general?.apiKey, refreshKey, setGamesList, t])

  const sortedAndFilteredGames = useMemo(
    () => sortAndFilterGames(gamesList, recentGames || [], sortStyle, isQuery, gameQueryValue),
    [gamesList, recentGames, sortStyle, isQuery, gameQueryValue],
  )

  const unplayedGamesMemo = useMemo(
    () => gamesList.filter(game => (game.playtime_forever ?? 0) === 0),
    [gamesList],
  )

  const randomUnplayedGames = useMemo(
    () => getRandomGames(unplayedGamesMemo, 10),
    [unplayedGamesMemo],
  )

  useEffect(() => {
    setFilteredGames(sortedAndFilteredGames)
    setVisibleGames(sortedAndFilteredGames)
  }, [sortedAndFilteredGames])

  useEffect(() => {
    setUnplayedGames(randomUnplayedGames)
  }, [randomUnplayedGames])

  useEffect(() => {
    // Clear search input when sort style changes
    setGameQueryValue('')
  }, [sortStyle, setGameQueryValue])

  return {
    isLoading,
    gamesList,
    recentGames: recentGames || [],
    unplayedGames,
    filteredGames,
    visibleGames,
    sortStyle,
    setSortStyle,
    refreshKey,
    setRefreshKey,
  }
}

// Fetch the games list and recent games from cache or API
export const fetchGamesList = async (
  steamId: string | undefined,
  refreshKey: number,
  prevRefreshKey: number,
  apiKey?: string,
) => {
  if (!steamId) return { gamesList: [], recentGamesList: [] }

  const fetchGamesListFromApi = async (apiKeyValue?: string) => {
    const params = new URLSearchParams({ steamId })
    if (apiKeyValue) params.set('apiKey', apiKeyValue)

    const response = await fetch(`/api/steam-games?${params.toString()}`)
    if (!response.ok) {
      return { gamesList: [], recentGamesList: [] }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return { gamesList: [], recentGamesList: [] }
    }

    const data = (await response.json()) as InvokeGamesList & { error?: string }

    if (!response.ok || data.error) {
      return { gamesList: [], recentGamesList: [] }
    }

    return {
      gamesList: data.games_list || [],
      recentGamesList: data.recent_games || [],
    }
  }

  const fetchGamesListFromApiWithKeyFallback = async () => {
    const fromApiWithUserKey = await fetchGamesListFromApi(apiKey)

    const hasDataWithUserKey =
      fromApiWithUserKey.gamesList.length > 0 || fromApiWithUserKey.recentGamesList.length > 0

    if (!hasDataWithUserKey && apiKey) {
      return fetchGamesListFromApi()
    }

    return fromApiWithUserKey
  }

  const apiGamesResult = await fetchGamesListFromApiWithKeyFallback()
  const hasApiGames =
    apiGamesResult.gamesList.length > 0 || apiGamesResult.recentGamesList.length > 0

  if (hasApiGames) {
    return apiGamesResult
  }

  // Try native backend first (desktop). If bridge is unavailable, fallback to API route.
  const cachedGamesListFiles = await invokeSafe<InvokeGamesList>('get_games_list_cache', {
    steamId,
  })
  if (!cachedGamesListFiles) {
    return apiGamesResult
  }

  // Try to get games from cache first
  const hasCachedGamesList = cachedGamesListFiles && cachedGamesListFiles.games_list.length > 0

  const cachedGamesList = cachedGamesListFiles.games_list
  const cachedRecentGamesList = cachedGamesListFiles.recent_games

  // Use cache if available and user hasn't reqested a refresh
  if (hasCachedGamesList && refreshKey === prevRefreshKey) {
    return {
      gamesList: cachedGamesList || [],
      recentGamesList: cachedRecentGamesList || [],
    }
  } else {
    // Fallback to API if cache isn't available or user requested refresh
    const gamesListResponse = await invokeSafe<InvokeGamesList>('get_games_list', {
      steamId,
      apiKey: apiKey ? decrypt(apiKey) : null,
    })

    const recentGamesListResponse = await invokeSafe<InvokeGamesList>('get_recent_games', {
      steamId,
      apiKey: apiKey ? decrypt(apiKey) : null,
    })

    if (!gamesListResponse || !recentGamesListResponse) {
      return apiGamesResult
    }

    const gamesList = gamesListResponse.games_list
    const recentGamesList = recentGamesListResponse.games_list

    if ((gamesList?.length || 0) === 0 && (recentGamesList?.length || 0) === 0) {
      return apiGamesResult
    }

    return {
      gamesList: gamesList || [],
      recentGamesList: recentGamesList || [],
    }
  }
}

// Sort and filter the games list based on sortStyle
export const sortAndFilterGames = (
  gamesList: Game[],
  recentGames: Game[],
  sortStyle: string,
  isQuery: boolean,
  gameQueryValue: string,
) => {
  let sortedAndFilteredGames = [...gamesList]
  switch (sortStyle) {
    case 'a-z':
      // Alphabetical sort by game name
      sortedAndFilteredGames.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'z-a':
      // Reverse alphabetical sort by game name
      sortedAndFilteredGames.sort((a, b) => b.name.localeCompare(a.name))
      break
    case '1-0':
      // Sort by playtime (highest first)
      sortedAndFilteredGames.sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
      break
    case '0-1':
      // Sort by playtime (lowest first)
      sortedAndFilteredGames.sort((a, b) => (a.playtime_forever ?? 0) - (b.playtime_forever ?? 0))
      break
    case 'recent':
      // Sort by recently played games
      sortedAndFilteredGames = recentGames
      break
    default:
      break
  }
  if (isQuery && gameQueryValue.trim()) {
    // Filter by search term
    sortedAndFilteredGames = sortedAndFilteredGames.filter(item =>
      item.name.toLowerCase().includes(gameQueryValue.toLowerCase().trim()),
    )
  }
  return sortedAndFilteredGames
}

// Helper function to get random games from an array
const getRandomGames = (games: Game[], count: number) => {
  const shuffled = [...games].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
