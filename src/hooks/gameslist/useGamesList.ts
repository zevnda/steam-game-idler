import type { Game, InvokeGamesList, SortStyleValue } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchStore } from '@/stores/searchStore'
import { useUserStore } from '@/stores/userStore'
import { useTranslation } from 'react-i18next'

import { decrypt, logEvent } from '@/utils/tasks'
import { showDangerToast } from '@/utils/toasts'

interface GameListResult {
  gamesList: Game[]
  recentGamesList: Game[]
}

export interface GamesListHook {
  isLoading: boolean
  gamesList: Game[]
  recentGames: Game[]
  unplayedGames: Game[]
  filteredGames: Game[]
  visibleGames: Game[]
  sortStyle: string
  setSortStyle: Dispatch<SetStateAction<string>>
  refreshKey: number
  setRefreshKey: Dispatch<SetStateAction<number>>
}

export default function useGamesList(): GamesListHook {
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
    const getGamesList = async (): Promise<void> => {
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

  const unplayedGamesMemo = useMemo(() => gamesList.filter(game => (game.playtime_forever ?? 0) === 0), [gamesList])

  const randomUnplayedGames = useMemo(() => getRandomGames(unplayedGamesMemo, 10), [unplayedGamesMemo])

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
): Promise<GameListResult> => {
  if (!steamId) return { gamesList: [], recentGamesList: [] }
  // Try to get games from cache first
  const cachedGamesListFiles = await invoke<InvokeGamesList>('get_games_list_cache', { steamId })

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
    const gamesListResponse = await invoke<InvokeGamesList>('get_games_list', {
      steamId,
      apiKey: apiKey ? decrypt(apiKey) : null,
    })

    const recentGamesListResponse = await invoke<InvokeGamesList>('get_recent_games', {
      steamId,
      apiKey: apiKey ? decrypt(apiKey) : null,
    })

    const gamesList = gamesListResponse.games_list
    const recentGamesList = recentGamesListResponse.games_list

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
): Game[] => {
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
const getRandomGames = (games: Game[], count: number): Game[] => {
  const shuffled = [...games].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
