import { useCallback, useEffect, useRef } from 'react'
import { autoRedeemFreeGames, checkForFreeGames } from '@/shared/services/freeGamesService'
import { useUserStore } from '@/shared/stores'
import { hasGamerFeature } from '@/shared/utils'

export function useFreeGames() {
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const freeGamesList = useUserStore(s => s.freeGamesList)
  const setFreeGamesList = useUserStore(s => s.setFreeGamesList)
  const gamesList = useUserStore(s => s.gamesList)
  const proTier = useUserStore(s => s.proTier)
  const lastRedeemedIdsRef = useRef<string>('')

  const freeGamesCheck = useCallback(() => {
    checkForFreeGames(setFreeGamesList, gamesList)
  }, [setFreeGamesList, gamesList])

  useEffect(() => {
    freeGamesCheck()
    const id = setInterval(freeGamesCheck, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [userSummary?.steamId, freeGamesCheck])

  useEffect(() => {
    if (
      !hasGamerFeature(proTier) ||
      !userSettings.general.autoRedeemFreeGames ||
      freeGamesList.length === 0
    )
      return

    const ids = freeGamesList
      .map(g => g.appid)
      .sort()
      .join(',')
    if (lastRedeemedIdsRef.current === ids) return
    lastRedeemedIdsRef.current = ids
    autoRedeemFreeGames(freeGamesList, setFreeGamesList, userSummary)
  }, [
    proTier,
    userSettings.general.autoRedeemFreeGames,
    freeGamesList,
    setFreeGamesList,
    userSummary,
  ])
}
