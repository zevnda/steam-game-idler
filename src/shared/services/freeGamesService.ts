import type {
  Game,
  InvokeFreeGames,
  InvokeRedeemFreeGame,
  InvokeSettings,
  UserSummary,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores/userStore'
import { sendNativeNotification } from '@/shared/utils/system'

export async function checkForFreeGames(
  setFreeGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void,
  gamesList: Game[],
) {
  try {
    const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
    if (!userSummary?.steamId || gamesList.length === 0) return

    const res = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary.steamId,
    })
    const { freeGameNotifications } = res.settings.general

    const freeGamesRes = await invoke<InvokeFreeGames>('get_free_games').catch(() => null)
    if (!freeGamesRes) return

    const ownedAppIds = new Set(gamesList.map(g => Number(g.appid)))
    const filtered = freeGamesRes.games.filter(g => !ownedAppIds.has(Number(g.appid)))

    const oldIdsStr = localStorage.getItem('freeGamesIds')
    const oldIds: number[] = oldIdsStr ? JSON.parse(oldIdsStr) : []
    const newIds = filtered.map(g => Number(g.appid))

    if (filtered.length > 0) {
      setFreeGamesList(filtered)

      const sortedOld = [...oldIds].sort((a, b) => a - b)
      const sortedNew = [...newIds].sort((a, b) => a - b)

      if (JSON.stringify(sortedOld) !== JSON.stringify(sortedNew)) {
        localStorage.setItem('freeGamesIds', JSON.stringify(newIds))
        if (freeGameNotifications) {
          await sendNativeNotification(
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
    toast.danger(i18next.t('common.error'))
    console.error('Error in checkForFreeGames:', error)
    await logEvent(`[Error] in (checkForFreeGames): ${error}`)
  }
}

export async function autoRedeemFreeGames(
  freeGamesList: Game[],
  setFreeGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void,
  userSummary: UserSummary,
) {
  try {
    const redeemedIds: number[] = []

    for (const game of freeGamesList) {
      const result = await invoke<InvokeRedeemFreeGame>('redeem_free_game', { appId: game.appid })
      if (result.success) {
        toast.success(i18next.t('toast.autoRedeem.success', { appName: game.name }))
        await logEvent(`[Auto Redeem] Redeemed ${game.name} (${game.appid})`)
        redeemedIds.push(Number(game.appid))
      } else {
        toast.danger(i18next.t('toast.autoRedeem.failure', { appName: game.name }))
        await logEvent(`[Auto Redeem] Failed ${game.name} (${game.appid}) - ${result.message}`)
      }
    }

    if (redeemedIds.length > 0) {
      setFreeGamesList(prev => prev.filter(g => !redeemedIds.includes(Number(g.appid))))
      const oldIdsStr = localStorage.getItem('freeGamesIds')
      const oldIds: number[] = oldIdsStr ? JSON.parse(oldIdsStr) : []
      localStorage.setItem(
        'freeGamesIds',
        JSON.stringify(oldIds.filter(id => !redeemedIds.includes(id))),
      )

      setTimeout(() => {
        useUserStore.getState().incrementGamesListRefreshKey()
      }, 3000)
    }
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in autoRedeemFreeGames:', error)
    await logEvent(`[Error] in (autoRedeemFreeGames): ${error}`)
  }
}
