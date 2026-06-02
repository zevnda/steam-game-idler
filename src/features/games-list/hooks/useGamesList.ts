import type { Game, SortStyleValue } from '@/shared/types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchGamesList,
  getRandomGames,
  silentlyUpdateGamesList,
  sortAndFilterGames,
} from '@/features/games-list/services/gamesListService'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUiStore, useUserStore } from '@/shared/stores'
import { hasGamerFeature } from '@/shared/utils'
import {
  GAMES_LIST_AUTO_UPDATE_COOLDOWN_MS,
  GAMES_LIST_AUTO_UPDATE_KEY,
} from '@/shared/utils/constants'

export function useGamesList() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const proTier = useUserStore(s => s.proTier)
  const gamesList = useUserStore(s => s.gamesList)
  const setGamesList = useUserStore(s => s.setGamesList)
  const refreshKey = useUserStore(s => s.gamesListRefreshKey)
  const incrementRefreshKey = useUserStore(s => s.incrementGamesListRefreshKey)
  const gamesListSessionUpdated = useUiStore(s => s.gamesListSessionUpdatedSet)
  const setGamesListSessionUpdated = useUiStore(s => s.setGamesListSessionUpdated)
  const gameQuery = useUiStore(s => s.gameQuery)
  const setGameQuery = useUiStore(s => s.setGameQuery)

  const [isLoading, setIsLoading] = useState(true)
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const [unplayedGames, setUnplayedGames] = useState<Game[]>([])
  const [sortStyle, setSortStyle] = useState<SortStyleValue>(
    (localStorage.getItem('sortStyle') as SortStyleValue) || '1-0',
  )

  const prevRefreshKeyRef = useRef(refreshKey)
  const gamesListRef = useRef<Game[]>(gamesList)

  useEffect(() => {
    return () => setGameQuery('')
  }, [setGameQuery])
  useEffect(() => {
    gamesListRef.current = gamesList
  }, [gamesList])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const stored = localStorage.getItem('sortStyle') as SortStyleValue
        if (stored) setSortStyle(stored)

        const { gamesList: newList, recentGamesList } = await fetchGamesList(
          userSummary?.steamId,
          refreshKey,
          prevRefreshKeyRef.current,
          userSettings.general?.apiKey || undefined,
        )

        setGamesList(newList)
        setRecentGames(recentGamesList)
        setUnplayedGames(
          getRandomGames(
            newList.filter(g => (g.playtime_forever ?? 0) === 0),
            10,
          ),
        )
        prevRefreshKeyRef.current = refreshKey
      } catch (error) {
        toast.danger(t('common.error'))
        console.error('Error loading games list:', error)
        await logEvent(`[Error] in (getGamesList): ${error}`)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    return () => {
      setRecentGames([])
      setUnplayedGames([])
    }
  }, [userSummary?.steamId, userSettings.general?.apiKey, refreshKey, setGamesList, t])

  useEffect(() => {
    setGameQuery('')
  }, [sortStyle, setGameQuery])

  const filteredGames = useMemo(
    () => sortAndFilterGames(gamesList, recentGames, sortStyle, gameQuery),
    [gamesList, recentGames, sortStyle, gameQuery],
  )

  useEffect(() => {
    if (isLoading) return
    if (!hasGamerFeature(proTier) || !userSettings.general?.autoUpdateGamesList) return

    const checkAndUpdate = async () => {
      if (!userSummary?.steamId) return
      const updated = await silentlyUpdateGamesList(
        userSummary.steamId,
        userSettings.general?.apiKey || null,
        true,
        GAMES_LIST_AUTO_UPDATE_KEY,
        GAMES_LIST_AUTO_UPDATE_COOLDOWN_MS,
      )
      if (updated) setGamesList(updated)
    }

    checkAndUpdate()
    const id = setInterval(() => {
      silentlyUpdateGamesList(
        userSummary!.steamId,
        userSettings.general?.apiKey || null,
        false,
        GAMES_LIST_AUTO_UPDATE_KEY,
        GAMES_LIST_AUTO_UPDATE_COOLDOWN_MS,
      ).then(updated => {
        if (updated) setGamesList(updated)
      })
    }, GAMES_LIST_AUTO_UPDATE_COOLDOWN_MS)
    return () => clearInterval(id)
  }, [
    isLoading,
    proTier,
    userSettings.general?.autoUpdateGamesList,
    userSummary,
    userSettings.general?.apiKey,
    setGamesList,
  ])

  useEffect(() => {
    if (
      isLoading ||
      !userSummary ||
      hasGamerFeature(proTier) ||
      gamesListSessionUpdated.has(userSummary.steamId)
    )
      return
    setGamesListSessionUpdated(userSummary.steamId)

    const runUpdate = async () => {
      if (!userSummary?.steamId) return
      const updated = await silentlyUpdateGamesList(
        userSummary.steamId,
        userSettings.general?.apiKey || null,
        true,
        GAMES_LIST_AUTO_UPDATE_KEY,
        0,
      )
      if (updated) setGamesList(updated)
    }
    runUpdate()
  }, [
    isLoading,
    proTier,
    gamesListSessionUpdated,
    setGamesListSessionUpdated,
    userSummary,
    userSettings.general?.apiKey,
    setGamesList,
  ])

  return {
    isLoading,
    gamesList,
    recentGames,
    unplayedGames,
    filteredGames,
    sortStyle,
    setSortStyle,
    refreshKey,
    incrementRefreshKey,
  }
}
