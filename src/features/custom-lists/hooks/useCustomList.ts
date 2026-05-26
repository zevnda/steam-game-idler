import type { Game, InvokeCustomList, InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { showDangerToast } from '@/shared/components'
import { useSearchStore, useStateStore, useUserStore } from '@/shared/stores'

export type CustomListTab = 'all' | 'list' | 'blacklist'

export function useCustomList(listName: string) {
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const isCardFarming = useStateStore(state => state.isCardFarming)
  const userSummary = useUserStore(state => state.userSummary)
  const gamesList = useUserStore(state => state.gamesList)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const searchTerm = useSearchStore(state => state.customListQueryValue)
  const [list, setList] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<CustomListTab>('list')
  const [disabledAutoIdleGames, setDisabledAutoIdleGames] = useState<Set<number>>(new Set())

  // Filter games based on search term
  const filteredGamesList = gamesList.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    if (listName === 'autoIdleList' && userSummary?.steamId) {
      const stored = localStorage.getItem(`autoIdleDisabled_${userSummary.steamId}`)
      setDisabledAutoIdleGames(stored ? new Set(JSON.parse(stored) as number[]) : new Set())
    }
  }, [listName, userSummary?.steamId])

  useEffect(() => {
    const getCustomLists = async () => {
      // Fetch the custom list data
      const response = await invoke<InvokeCustomList>('get_custom_lists', {
        steamId: userSummary?.steamId,
        list: listName,
      })
      if (!response.error) {
        setList(response.list_data)
      } else {
        showDangerToast(response.error)
        setList([])
      }
      setIsLoading(false)
    }
    getCustomLists()
  }, [userSummary?.steamId, isAchievementUnlocker, isCardFarming, listName])

  const handleAddGame = async (game: Game) => {
    // Add single game to the custom list
    const response = await invoke<InvokeCustomList>('add_game_to_custom_list', {
      steamId: userSummary?.steamId,
      game: { appid: game.appid, name: game.name },
      list: listName,
    })
    if (!response.error) {
      setList(response.list_data)
    } else {
      showDangerToast(response.error)
    }
  }

  const handleAddAllGames = async (games: Game[]) => {
    // First clear the list, then add all games in one go
    const clearResponse = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList: [],
    })
    if (!clearResponse.error) {
      const addResponse = await invoke<InvokeCustomList>('update_custom_list', {
        steamId: userSummary?.steamId,
        list: listName,
        newList: games,
      })
      if (!addResponse.error) {
        setList(addResponse.list_data)
      } else {
        showDangerToast(addResponse.error)
      }
    } else {
      showDangerToast(clearResponse.error)
    }
  }

  const handleAddAllResults = async (games: Game[]) => {
    const newGames = games.filter(
      game => !list.some(existingGame => existingGame.appid === game.appid),
    )

    const combinedList = [...list, ...newGames]

    const addResponse = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList: combinedList,
    })
    if (!addResponse.error) {
      setList(addResponse.list_data)
    } else {
      showDangerToast(addResponse.error)
    }
  }

  const handleRemoveGame = async (game: Game) => {
    // Remove a game from the custom list
    const response = await invoke<InvokeCustomList>('remove_game_from_custom_list', {
      steamId: userSummary?.steamId,
      game: { appid: game.appid, name: game.name },
      list: listName,
    })
    if (!response.error) {
      setList(response.list_data)
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
      showDangerToast(response.error)
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
    // Blacklist a game (only for card farming list)
    const cachedUserSummary = await invoke<InvokeSettings>('get_user_settings', {
      steamId: userSummary?.steamId,
    })

    const currentBlacklist: number[] = cachedUserSummary.settings.cardFarming.blacklist || []

    // if already in blacklist, remove it
    const updatedBlacklist = currentBlacklist.includes(game.appid)
      ? currentBlacklist.filter(appid => appid !== game.appid)
      : [...currentBlacklist, game.appid]

    if (updatedBlacklist.length === 0 && activeTab === 'blacklist') {
      // Fall back to All Games when the blacklist empties while viewing it
      setActiveTab('all')
    }

    invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.blacklist',
      value: updatedBlacklist,
    })

    setUserSettings(prevSettings => ({
      ...prevSettings,
      cardFarming: {
        ...prevSettings.cardFarming,
        blacklist: updatedBlacklist,
      },
    }))
  }

  const handleUpdateListOrder = async (newList: Game[]) => {
    // Save the new order of games in the list (after drag n drop)
    const response = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList,
    })
    if (!response.error) {
      setList(response.list_data)
    } else {
      showDangerToast(response.error)
    }
  }

  const handleClearList = async () => {
    // Remove all games from the list
    const response = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList: [],
    })
    if (!response.error) {
      setList([])
    } else {
      showDangerToast(response.error)
    }
  }

  const handleClearBlacklist = () => {
    invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'cardFarming.blacklist',
      value: [],
    })
    setUserSettings(prevSettings => ({
      ...prevSettings,
      cardFarming: {
        ...prevSettings.cardFarming,
        blacklist: [],
      },
    }))
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
