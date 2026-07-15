import type { GameWithDrops, SteamCookies } from '../types'
import { useCallback, useState } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

// Data source for the "Games With Drops" browse tab (`CardFarmingPage.tsx`) - this only ever runs
// once the account is already `connected` (see `useCardFarming`'s `connect`), which has already
// resolved cookies for this account - so `refresh` here just reuses those same cookies rather than
// re-deriving.
export const useGamesWithDrops = () => {
  const account = useSessionStore(state => state.account)
  const [games, setGames] = useState<GameWithDrops[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  // Returns whether the fetch succeeded (not the games themselves - callers that also need to know
  // whether cookies actually resolved, like `useCardFarming`'s `connect`, read this instead of
  // wiring up their own try/catch around a second fetch).
  const refresh = useCallback(
    async (manualCookies: SteamCookies | undefined) => {
      if (!account) return false
      setIsLoading(true)
      setErrorCode(null)
      try {
        setGames(
          await invoke<GameWithDrops[]>('get_games_with_drops', {
            account,
            manualCookies: manualCookies ?? null,
          }),
        )
        return true
      } catch (error) {
        console.error('Error in (get_games_with_drops) [browse]:', error)
        setErrorCode(String(error))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [account],
  )

  // Optimistic local removal for a just-blacklisted game - `get_games_with_drops` already
  // excludes blacklisted app IDs server-side (see `card_farming::blacklist`'s doc comment), so the
  // next `refresh` would drop it anyway; this just avoids waiting on a round trip for the browse
  // card to disappear.
  const removeGame = useCallback((appId: number) => {
    setGames(prev => prev.filter(game => game.appId !== appId))
  }, [])

  return { games, isLoading, errorCode, refresh, removeGame }
}
