import type { Game, InvokeGamesList, SortStyleValue } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import moment from 'moment'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores/userStore'
import { decrypt } from '@/shared/utils/crypto'

export async function fetchGamesList(
  steamId: string | undefined,
  refreshKey: number,
  prevRefreshKey: number,
  apiKey?: string,
) {
  if (!steamId) return { gamesList: [], recentGamesList: [] }

  const cached = await invoke<InvokeGamesList>('get_games_list_cache', { steamId })
  const hasCached = cached?.games_list?.length > 0

  if (hasCached && refreshKey === prevRefreshKey) {
    return { gamesList: cached.games_list ?? [], recentGamesList: cached.recent_games ?? [] }
  }

  const [gamesRes, recentRes] = await Promise.all([
    invoke<InvokeGamesList>('get_games_list', {
      steamId,
      apiKey: apiKey ? decrypt(apiKey) : null,
    }),
    invoke<InvokeGamesList>('get_recent_games', {
      steamId,
      apiKey: apiKey ? decrypt(apiKey) : null,
    }),
  ])

  return {
    gamesList: gamesRes.games_list ?? [],
    recentGamesList: recentRes.games_list ?? [],
  }
}

export async function silentlyUpdateGamesList(
  steamId: string,
  apiKey: string | null,
  showToast: boolean,
  cooldownKey: string,
  cooldownMs: number,
) {
  const lastUpdate = Number(localStorage.getItem(cooldownKey) || 0)
  if (Date.now() - lastUpdate < cooldownMs) return null

  const res = await invoke<InvokeGamesList>('get_games_list', {
    steamId,
    apiKey: apiKey ? decrypt(apiKey) : null,
  })
  const newList = res.games_list ?? []
  localStorage.setItem(cooldownKey, String(Date.now()))

  const currentList = useUserStore.getState().gamesList
  const currentIds = new Set(currentList.map(g => g.appid))
  const newIds = new Set(newList.map(g => g.appid))
  const hasChanges =
    newList.some(g => !currentIds.has(g.appid)) || currentList.some(g => !newIds.has(g.appid))

  if (hasChanges) {
    if (showToast) toast.primary(i18next.t('toast.gamesListUpdated'))
    return newList
  }
  return null
}

export function sortAndFilterGames(
  gamesList: Game[],
  recentGames: Game[],
  sortStyle: SortStyleValue,
  query: string,
) {
  let result = [...gamesList]

  switch (sortStyle) {
    case 'a-z':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'z-a':
      result.sort((a, b) => b.name.localeCompare(a.name))
      break
    case '1-0':
      result.sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
      break
    case '0-1':
      result.sort((a, b) => (a.playtime_forever ?? 0) - (b.playtime_forever ?? 0))
      break
    case 'recent':
      result = [...recentGames]
      break
  }

  if (query.trim()) {
    result = result.filter(g => g.name.toLowerCase().includes(query.toLowerCase().trim()))
  }

  return result
}

export function getRandomGames(games: Game[], count: number) {
  return [...games].sort(() => 0.5 - Math.random()).slice(0, count)
}

export async function refreshGamesList(
  steamId: string | undefined,
  incrementRefreshKey: () => void,
  manual: boolean,
) {
  try {
    if (manual && steamId !== '76561198158912649' && steamId !== '76561198999797359') {
      const cooldown = sessionStorage.getItem('cooldown')
      if (cooldown && moment().unix() < Number(cooldown)) {
        return toast.primary(
          i18next.t('toast.refetch.cooldown', {
            time: moment.unix(Number(cooldown)).format('h:mm A'),
          }),
        )
      }
    }
    await invoke('delete_user_games_list_files', { steamId })
    sessionStorage.setItem('cooldown', String(moment().add(30, 'minutes').unix()))
    incrementRefreshKey()
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in refreshGamesList:', error)
    await logEvent(`[Error] in (handleRefetch): ${error}`)
  }
}

export function changeSortStyle(
  key: string | undefined,
  setSortStyle: (v: SortStyleValue) => void,
) {
  if (!key) return
  localStorage.setItem('sortStyle', key)
  setSortStyle(key)
}
