import type i18next from '@/i18n/i18n'
import type { SortStyleValue } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import moment from 'moment'
import { showDangerToast, showPrimaryToast } from '@/shared/ui'
import { logEvent } from '@/shared/utils'

export const usePageHeader = (
  setSortStyle: React.Dispatch<React.SetStateAction<SortStyleValue>>,
) => {
  const { t } = useTranslation()

  const handleSorting = (currentKey: string | undefined) => {
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
  t: typeof i18next.t,
  steamId: string | undefined,
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>,
  manual: boolean,
) => {
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
