import type { Game, InvokeGamesList, SortStyleValue } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showDangerToast, showPrimaryToast } from '@/shared/components'
import { useSearchStore, useUserStore } from '@/shared/stores'
import { decrypt, hasGamerFeature, logEvent } from '@/shared/utils'

export function useGamesList() {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const proTier = useUserStore(state => state.proTier)
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
  const gamesListRef = useRef<Game[]>(gamesList)
  const AUTO_UPDATE_COOLDOWN_MS = 15 * 60 * 1000
  const AUTO_UPDATE_STORAGE_KEY = 'gamesListLastAutoUpdate'

  // Keep ref in sync with latest gamesList to avoid stale closures in auto-update
  useEffect(() => {
    gamesListRef.current = gamesList
  }, [gamesList])

  const silentlyUpdateGamesList = useCallback(
    async (showToast: boolean) => {
      if (
        !userSummary?.steamId ||
        !hasGamerFeature(proTier) ||
        !userSettings.general?.autoUpdateGamesList
      )
        return

      // Respect the shared 15-minute cooldown regardless of how this was triggered
      const lastUpdate = Number(localStorage.getItem(AUTO_UPDATE_STORAGE_KEY) || 0)
      if (Date.now() - lastUpdate < AUTO_UPDATE_COOLDOWN_MS) return

      try {
        const apiKey = userSettings.general?.apiKey || undefined
        const gamesListResponse = await invoke<InvokeGamesList>('get_games_list', {
          steamId: userSummary.steamId,
          apiKey: apiKey ? decrypt(apiKey) : null,
        })
        const newGamesList = gamesListResponse.games_list
        const currentIds = new Set(gamesListRef.current.map(g => g.appid))
        const newIds = new Set(newGamesList.map(g => g.appid))
        const hasChanges =
          newGamesList.some(g => !currentIds.has(g.appid)) ||
          gamesListRef.current.some(g => !newIds.has(g.appid))

        // Always update the timestamp so both paths share the same cooldown
        localStorage.setItem(AUTO_UPDATE_STORAGE_KEY, String(Date.now()))

        if (hasChanges) {
          setGamesList(newGamesList)
          if (showToast) showPrimaryToast(t('toast.gamesListUpdated'))
        }
      } catch (error) {
        console.error('Error in (silentlyUpdateGamesList):', error)
        logEvent(`[Error] in (silentlyUpdateGamesList): ${error}`)
      }
    },
    [
      userSummary?.steamId,
      proTier,
      userSettings.general?.autoUpdateGamesList,
      userSettings.general?.apiKey,
      AUTO_UPDATE_COOLDOWN_MS,
      AUTO_UPDATE_STORAGE_KEY,
      setGamesList,
      t,
    ],
  )

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

  // Auto-update games list for PRO users when the setting is enabled
  useEffect(() => {
    if (isLoading) return
    if (!hasGamerFeature(proTier) || !userSettings.general?.autoUpdateGamesList) return

    // Check on mount — runs if >15 mins have passed since the last update (or never updated)
    silentlyUpdateGamesList(true)

    // Also check periodically in case the user stays on the page the whole time
    const interval = setInterval(() => silentlyUpdateGamesList(false), 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isLoading, proTier, userSettings.general?.autoUpdateGamesList, silentlyUpdateGamesList])

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
