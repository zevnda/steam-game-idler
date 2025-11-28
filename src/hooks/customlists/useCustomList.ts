import type { Game, InvokeCustomList } from '@/types'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useRef, useState } from 'react'
import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'

import { showDangerToast } from '@/utils/toasts'

interface CustomListHook {
  list: Game[]
  setList: Dispatch<SetStateAction<Game[]>>
  visibleGames: number
  filteredGamesList: Game[]
  containerRef: RefObject<HTMLDivElement | null>
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  showInList: boolean
  setShowInList: Dispatch<SetStateAction<boolean>>
  handleAddGame: (game: Game) => Promise<void>
  handleAddAllGames: (games: Game[]) => Promise<void>
  handleAddAllResults: (games: Game[]) => Promise<void>
  handleRemoveGame: (game: Game) => Promise<void>
  handleUpdateListOrder: (newList: Game[]) => Promise<void>
  handleClearList: () => Promise<void>
}

export default function useCustomList(listName: string): CustomListHook {
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const isCardFarming = useStateStore(state => state.isCardFarming)
  const userSummary = useUserStore(state => state.userSummary)
  const gamesList = useUserStore(state => state.gamesList)
  const [list, setList] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showInList, setShowInList] = useState(false)
  const [visibleGames, setVisibleGames] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter games based on search term
  const filteredGamesList = gamesList.filter(game => game.name.toLowerCase().includes(searchTerm.toLowerCase()))

  useEffect(() => {
    const getCustomLists = async (): Promise<void> => {
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
    }
    getCustomLists()
  }, [userSummary?.steamId, isAchievementUnlocker, isCardFarming, listName])

  useEffect(() => {
    // Reset visible games when search query changes
    setVisibleGames(50)
  }, [searchTerm])

  useEffect(() => {
    // Setup infinite scroll
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [filteredGamesList, visibleGames])

  const handleScroll = (): void => {
    if (containerRef.current) {
      // Load more games when scrolled near bottom
      if (
        containerRef.current.scrollTop + containerRef.current.clientHeight >=
        containerRef.current.scrollHeight - 10
      ) {
        setVisibleGames(prevVisibleGames => prevVisibleGames + 50)
      }
    }
  }

  const handleAddGame = async (game: Game): Promise<void> => {
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

  const handleAddAllGames = async (games: Game[]): Promise<void> => {
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

  const handleAddAllResults = async (games: Game[]): Promise<void> => {
    const newGames = games.filter(game => !list.some(existingGame => existingGame.appid === game.appid))

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

  const handleRemoveGame = async (game: Game): Promise<void> => {
    // Remove a game from the custom list
    const response = await invoke<InvokeCustomList>('remove_game_from_custom_list', {
      steamId: userSummary?.steamId,
      game: { appid: game.appid, name: game.name },
      list: listName,
    })
    if (!response.error) {
      setList(response.list_data)
      if (response.list_data.length === 0) {
        // Switch view mode if list becomes empty
        setShowInList(false)
      }
    } else {
      showDangerToast(response.error)
    }
  }

  const handleUpdateListOrder = async (newList: Game[]): Promise<void> => {
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

  const handleClearList = async (): Promise<void> => {
    // Remove all games from the list
    const response = await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: listName,
      newList: [],
    })
    if (!response.error) {
      setList([])
      setShowInList(false)
    } else {
      showDangerToast(response.error)
    }
  }

  return {
    list,
    setList,
    visibleGames,
    filteredGamesList,
    containerRef,
    searchTerm,
    setSearchTerm,
    showInList,
    setShowInList,
    handleAddGame,
    handleAddAllGames,
    handleAddAllResults,
    handleRemoveGame,
    handleUpdateListOrder,
    handleClearList,
  }
}
