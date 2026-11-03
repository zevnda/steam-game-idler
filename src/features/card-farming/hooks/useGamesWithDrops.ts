import type { GamesWithDropsResult, GameWithDrops, SteamCookies } from '../types'
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
  const [blacklistedGames, setBlacklistedGames] = useState<GameWithDrops[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  // Returns `null` on success, or the error code on failure (not the games themselves - callers
  // that also need to know whether cookies actually resolved, like `useCardFarming`'s `connect`,
  // read this instead of wiring up their own try/catch around a second fetch). Returns the code
  // directly rather than having the caller read this hook's own `errorCode` state afterward -
  // `errorCode` only updates on this hook's *next* render, which hasn't happened yet by the time an
  // awaiting caller's own closure resumes, so a post-await read of `errorCode` off the object this
  // hook returned earlier is always one render stale (previously caused `connect` to silently miss
  // every failure code, since it read a snapshot from before this exact attempt).
  const refresh = useCallback(
    async (manualCookies: SteamCookies | undefined) => {
      if (!account) return 'no_account'
      setIsLoading(true)
      setErrorCode(null)
      try {
        const result = await invoke<GamesWithDropsResult>('get_games_with_drops', {
          account,
          manualCookies: manualCookies ?? null,
        })
        setGames(result.games)
        setBlacklistedGames(result.blacklisted)
        return null
      } catch (error) {
        console.error('Error in (get_games_with_drops) [browse]:', error)
        const code = String(error)
        setErrorCode(code)
        return code
      } finally {
        setIsLoading(false)
      }
    },
    [account],
  )

  // Optimistic local move for a just-blacklisted game - `get_games_with_drops` already splits
  // blacklisted app IDs out server-side (see `card_farming::blacklist`'s doc comment), so the next
  // `refresh` would do the same; this just avoids waiting on a round trip for the browse card to
  // disappear, and keeps its drop count for the Blacklist tab meanwhile.
  const removeGame = useCallback((appId: number) => {
    setGames(prev => {
      const game = prev.find(entry => entry.appId === appId)
      if (game) setBlacklistedGames(blacklisted => [...blacklisted, game])
      return prev.filter(entry => entry.appId !== appId)
    })
  }, [])

  return { games, blacklistedGames, isLoading, errorCode, refresh, removeGame }
}
