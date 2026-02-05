import type { SortStyleValue } from '@/shared/types'
import type { Dispatch, SetStateAction } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import moment from 'moment'
import { logEvent } from '@/shared/utils/tasks'
import { showDangerToast, showPrimaryToast } from '@/shared/utils/toasts'

interface PageHeaderHook {
  handleSorting: (currentKey: string | undefined) => void
}

export const usePageHeader = (
  setSortStyle: Dispatch<SetStateAction<SortStyleValue>>,
): PageHeaderHook => {
  const { t } = useTranslation()

  const handleSorting = (currentKey: string | undefined): void => {
    try {
      if (!currentKey) return
      // Save the selected sort style to localStorage and update state
      localStorage.setItem('sortStyle', currentKey)
      setSortStyle(currentKey)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (handleSorting):', error)
      logEvent(`[Error] in (handleSorting): ${error}`)
    }
  }

  return { handleSorting }
}

export const handleRefetch = async (
  t: (key: string, options?: Record<string, unknown>) => string,
  steamId: string | undefined,
  setRefreshKey: Dispatch<SetStateAction<number>>,
  manual: boolean = true,
): Promise<void> => {
  try {
    if (manual && steamId !== '76561198158912649' && steamId !== '76561198999797359') {
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
