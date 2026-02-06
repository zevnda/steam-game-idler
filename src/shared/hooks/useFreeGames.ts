import type {
  Game,
  InvokeFreeGames,
  InvokeRedeemFreeGame,
  InvokeSettings,
  UserSummary,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useRef } from 'react'
import i18next from 'i18next'
import { handleRefetch, useGamesList } from '@/features/gameslist'
import { useUserStore } from '@/shared/stores'
import { showDangerToast, showSuccessToast } from '@/shared/ui'
import { logEvent, sendNativeNotification } from '@/shared/utils'

interface GamesContext {
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
}

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

// Check for free games
export const checkForFreeGames = async (
  setFreeGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void,
  gamesList: Game[],
) => {
  try {
    // Wait for user summary and games list to be available
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (!userSummary?.steamId || gamesList.length === 0) return

    const response = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })
    const settings = response.settings

    const freeGameNotifications = settings.general.freeGameNotifications
    const freeGamesList = await getFreeGames()

    if (!freeGamesList) return

    // Filter out games the user already owns
    const ownedAppIds = new Set(gamesList.map(game => Number(game.appid)))
    const filteredFreeGames = freeGamesList.games.filter(
      game => !ownedAppIds.has(Number(game.appid)),
    )

    // Compare the new free games with the old ones
    const oldFreeGamesIdsStr = localStorage.getItem('freeGamesIds')
    const oldFreeGameIds: number[] = oldFreeGamesIdsStr ? JSON.parse(oldFreeGamesIdsStr) : []
    const newFreeGameIds: number[] = filteredFreeGames.map(game => Number(game.appid))

    // Show free games tab if there are any
    if (filteredFreeGames.length > 0) {
      setFreeGamesList(filteredFreeGames)

      // Sort the arrays before comparing to ignore order differences
      const sortedOldIds = [...oldFreeGameIds].sort((a, b) => a - b)
      const sortedNewIds = [...newFreeGameIds].sort((a, b) => a - b)

      // Only notify if the list of free games has changed
      if (JSON.stringify(sortedOldIds) !== JSON.stringify(sortedNewIds)) {
        localStorage.setItem('freeGamesIds', JSON.stringify(newFreeGameIds))
        if (freeGameNotifications) {
          sendNativeNotification(
            'Free Games Available!',
            'Check the sidebar for the 🎁 icon to get your free games',
          )
        }
      }
    } else {
      localStorage.setItem('freeGamesIds', JSON.stringify([]))
      setFreeGamesList([])
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (checkForFreeGames):', error)
    logEvent(`[Error] in (checkForFreeGames): ${error}`)
  }
}

// Auto redeem free games
export const autoRedeemFreeGames = async (
  freeGamesList: Game[],
  setFreeGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void,
  userSummary: UserSummary,
  gamesContext: GamesContext,
) => {
  try {
    const redeemedAppIds: number[] = []

    for (const game of freeGamesList) {
      const result = await invoke<InvokeRedeemFreeGame>('redeem_free_game', { appId: game.appid })
      if (result.success) {
        showSuccessToast(i18next.t('toast.autoRedeem.success', { appName: game.name }))
        logEvent(`[Auto Redeem] Successfully redeemed free game ${game.name} (${game.appid})`)
        redeemedAppIds.push(Number(game.appid))
      } else {
        showDangerToast(i18next.t('toast.autoRedeem.failure', { appName: game.name }))
        logEvent(
          `[Auto Redeem] Failed to redeem free game ${game.name} (${game.appid}) - ${result.message}`,
        )
      }
    }

    if (redeemedAppIds.length > 0) {
      // Update free games list and localStorage
      setFreeGamesList(prev => prev.filter(game => !redeemedAppIds.includes(Number(game.appid))))
      const oldIdsStr = localStorage.getItem('freeGamesIds')
      const oldIds: number[] = oldIdsStr ? JSON.parse(oldIdsStr) : []
      const newIds = oldIds.filter(id => !redeemedAppIds.includes(id))
      localStorage.setItem('freeGamesIds', JSON.stringify(newIds))

      setTimeout(() => {
        handleRefetch(i18next.t, userSummary?.steamId, gamesContext.setRefreshKey, false)
      }, 3000)
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (autoRedeemFreeGames):', error)
    logEvent(`[Error] in (autoRedeemFreeGames): ${error}`)
  }
}

// Get free games
async function getFreeGames() {
  try {
    const response = await invoke<InvokeFreeGames>('get_free_games')
    return response || null
  } catch (error) {
    console.error('Error in (getFreeGames):', error)
    logEvent(`[Error] in (getFreeGames): ${error}`)
    return null
  }
}
