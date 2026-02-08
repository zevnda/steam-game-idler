import { useCallback, useEffect, useRef } from 'react'
import { useGamesList } from '@/features/gameslist'
import { useUserStore } from '@/shared/stores'
import { autoRedeemFreeGames, checkForFreeGames } from '@/shared/utils'

export function useFreeGames() {
  const gamesContext = useGamesList()
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const freeGamesList = useUserStore(state => state.freeGamesList)
  const setFreeGamesList = useUserStore(state => state.setFreeGamesList)
  const gamesList = useUserStore(state => state.gamesList)
  const isPro = useUserStore(state => state.isPro)
  const lastRedeemedIdsRef = useRef<string>('')

  const freeGamesCheck = useCallback(() => {
    checkForFreeGames(setFreeGamesList, gamesList)
  }, [setFreeGamesList, gamesList])

  // Check for free games
  useEffect(() => {
    freeGamesCheck()

    const intervalId = setInterval(freeGamesCheck, 60 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [userSummary?.steamId, freeGamesCheck])

  // Auto redeem free games
  useEffect(() => {
    if (isPro && userSettings.general.autoRedeemFreeGames && freeGamesList.length > 0) {
      // Create a unique key for the current free games list
      const ids = freeGamesList
        .map(g => g.appid)
        .sort()
        .join(',')
      if (lastRedeemedIdsRef.current === ids) return // Already redeemed this set

      lastRedeemedIdsRef.current = ids
      autoRedeemFreeGames(freeGamesList, setFreeGamesList, userSummary, gamesContext)
    }
  }, [
    isPro,
    userSettings.general.autoRedeemFreeGames,
    freeGamesList,
    setFreeGamesList,
    userSummary,
    gamesContext,
  ])
}
