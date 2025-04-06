import type { SortStyleValue } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useState } from 'react'
import moment from 'moment'
import { useTranslation } from 'react-i18next'

import { logEvent } from '@/utils/tasks'
import { showDangerToast, showPrimaryToast } from '@/utils/toasts'

interface PageHeaderHook {
  sortStyle: SortStyleValue
  handleSorting: (currentKey: string | undefined) => void
  handleRefetch: (steamId: string | undefined) => Promise<void>
}

export const usePageHeader = (
  setSortStyle: Dispatch<SetStateAction<SortStyleValue>>,
  setRefreshKey: Dispatch<SetStateAction<number>>,
): PageHeaderHook => {
  const { t } = useTranslation()
  const [sortStyle, setSortStyleState] = useState<SortStyleValue>(
    (localStorage.getItem('sortStyle') as SortStyleValue) || '1-0',
  )

  // Update sort style when state changes
  useEffect(() => {
    setSortStyle(sortStyle)
  }, [sortStyle, setSortStyle])

  const handleSorting = (currentKey: string | undefined): void => {
    try {
      if (!currentKey) return
      // Save the selected sort style to localStorage and update state
      localStorage.setItem('sortStyle', currentKey)
      setSortStyleState(currentKey)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (handleSorting):', error)
      logEvent(`[Error] in (handleSorting): ${error}`)
    }
  }

  const handleRefetch = async (steamId: string | undefined): Promise<void> => {
    try {
      if (steamId !== '76561198158912649' && steamId !== '76561198999797359') {
        // Check if user is on cooldown for refreshing games
        const cooldown = sessionStorage.getItem('cooldown')
        if (cooldown && moment().unix() < Number(cooldown)) {
          return showPrimaryToast(
            t('toast.refetch.cooldown', {
              time: moment.unix(Number(cooldown)).format('h:mm A'),
            }),
          )
        }
      }

      // Delete cached games list files from backend
      await invoke('delete_user_games_list_files', { steamId })

      // Set a 30 min cooldown for refreshing games
      sessionStorage.setItem('cooldown', String(moment().add(30, 'minutes').unix()))

      // Trigger a refresh by incrementing the refresh key
      setRefreshKey(prevKey => prevKey + 1)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (handleRefetch):', error)
      logEvent(`[Error] in (handleRefetch): ${error}`)
    }
  }

  return { sortStyle, handleSorting, handleRefetch }
}
