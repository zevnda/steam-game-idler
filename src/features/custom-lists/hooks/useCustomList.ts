import type { Game, InvokeCustomList, InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { toast } from '@/shared/services/toastService'
import { useSessionStore, useUiStore, useUserStore } from '@/shared/stores'

export type CustomListTab = 'all' | 'list' | 'blacklist'

export function useCustomList(listName: string) {
  const isAchievementUnlocker = useSessionStore(s => s.isAchievementUnlocker)
  const isCardFarming = useSessionStore(s => s.isCardFarming)
  const userSummary = useUserStore(s => s.userSummary)
  const gamesList = useUserStore(s => s.gamesList)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const searchTerm = useUiStore(s => s.customListQuery)
  const [list, setList] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<CustomListTab>('list')
  const [disabledAutoIdleGames, setDisabledAutoIdleGames] = useState<Set<number>>(new Set())

  const filteredGamesList = gamesList.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    if (listName === 'autoIdleList' && userSummary?.steamId) {
      const stored = localStorage.getItem(`autoIdleDisabled_${userSummary.steamId}`)
      setDisabledAutoIdleGames(stored ? new Set(JSON.parse(stored) as number[]) : new Set())
    }
  }, [listName, userSummary?.steamId])

  useEffect(() => {
    const load = async () => {
      const res = await invoke<InvokeCustomList>('get_custom_lists', {
        steamId: userSummary?.steamId,
        list: listName,
      })
      if (!res.error) setList(res.list_data)
      else toast.danger(res.error)
      setIsLoading(false)
    }
    load()
  }, [userSummary?.steamId, isAchievementUnlocker, isCardFarming, listName])

  const handleAddGame = async (game: Game) => {
    const res = await invoke<InvokeCustomList>('add_game_to_custom_list', {
      steamId: userSummary?.steamId,
      game: { appid: game.appid, name: game.name },
      list: listName,
    })
    if (!res.error) setList(res.list_data)
    else toast.danger(res.error)
  }

  const handleAddAllGames = async (games: Game[]) => {
    const clear = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList: [],
    })
    if (clear.error) {
      toast.danger(clear.error)
      return
    }
    const add = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList: games,
    })
    if (!add.error) setList(add.list_data)
    else toast.danger(add.error)
  }

  const handleAddAllResults = async (games: Game[]) => {
    const newGames = games.filter(g => !list.some(e => e.appid === g.appid))
    const res = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList: [...list, ...newGames],
    })
    if (!res.error) setList(res.list_data)
    else toast.danger(res.error)
  }

  const handleRemoveGame = async (game: Game) => {
    const res = await invoke<InvokeCustomList>('remove_game_from_custom_list', {
      steamId: userSummary?.steamId,
      game: { appid: game.appid, name: game.name },
      list: listName,
    })
    if (!res.error) {
      setList(res.list_data)
      if (
        listName === 'autoIdleList' &&
        userSummary?.steamId &&
        disabledAutoIdleGames.has(game.appid)
      ) {
        setDisabledAutoIdleGames(prev => {
          const next = new Set(prev)
          next.delete(game.appid)
          localStorage.setItem(`autoIdleDisabled_${userSummary.steamId}`, JSON.stringify([...next]))
          return next
        })
      }
    } else {
      toast.danger(res.error)
    }
  }

  const handleToggleAutoIdleGame = (appid: number) => {
    if (!userSummary?.steamId) return
    setDisabledAutoIdleGames(prev => {
      const next = new Set(prev)
      if (next.has(appid)) next.delete(appid)
      else next.add(appid)
      localStorage.setItem(`autoIdleDisabled_${userSummary.steamId}`, JSON.stringify([...next]))
      return next
    })
  }

  const handleBlacklistGame = async (game: Game) => {
    const settings = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })
    const currentBlacklist: number[] = settings.settings.cardFarming.blacklist || []
    const updatedBlacklist = currentBlacklist.includes(game.appid)
      ? currentBlacklist.filter(id => id !== game.appid)
      : [...currentBlacklist, game.appid]
    if (updatedBlacklist.length === 0 && activeTab === 'blacklist') setActiveTab('all')
    await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.blacklist',
      value: updatedBlacklist,
    })
    setUserSettings(prev => ({
      ...prev,
      cardFarming: { ...prev.cardFarming, blacklist: updatedBlacklist },
    }))
  }

  const handleUpdateListOrder = async (newList: Game[]) => {
    const res = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList,
    })
    if (!res.error) setList(res.list_data)
    else toast.danger(res.error)
  }

  const handleClearList = async () => {
    const res = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList: [],
    })
    if (!res.error) setList([])
    else toast.danger(res.error)
  }

  const handleClearBlacklist = () => {
    invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.blacklist',
      value: [],
    })
    setUserSettings(prev => ({ ...prev, cardFarming: { ...prev.cardFarming, blacklist: [] } }))
  }

  return {
    list,
    setList,
    isLoading,
    filteredGamesList,
    searchTerm,
    activeTab,
    setActiveTab,
    handleAddGame,
    handleAddAllGames,
    handleAddAllResults,
    handleRemoveGame,
    handleUpdateListOrder,
    handleClearList,
    handleClearBlacklist,
    handleBlacklistGame,
    disabledAutoIdleGames,
    handleToggleAutoIdleGame,
  }
}
