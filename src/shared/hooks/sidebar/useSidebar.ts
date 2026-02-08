import type { ActivePageType, CurrentTabType } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { useDisclosure } from '@heroui/react'
import { showDangerToast } from '@/shared/components'
import { useNavigationStore, useSearchStore, useUserStore } from '@/shared/stores'
import { logEvent } from '@/shared/utils'

export function useSidebar(
  activePage: ActivePageType,
  setActivePage: (value: ActivePageType) => void,
) {
  const { t } = useTranslation()
  const setGameQueryValue = useSearchStore(state => state.setGameQueryValue)
  const setAchievementQueryValue = useSearchStore(state => state.setAchievementQueryValue)
  const setCurrentTab = useNavigationStore(state => state.setCurrentTab)
  const userSummary = useUserStore(state => state.userSummary)
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const openConfirmation = () => {
    onOpen()
  }

  // Handle logging out
  const handleLogout = async (onClose: () => void) => {
    try {
      onClose()
      setUserSummary(null)
      clearLocalStorageData()
      await invoke('kill_all_steamutil_processes')
      logEvent(`[System] Logged out of ${userSummary?.personaName}`)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (handleLogout):', error)
      logEvent(`[Error] in (handleLogout): ${error}`)
    }
  }

  // Clear local storage data and reset states on logout
  const clearLocalStorageData = async () => {
    try {
      setActivePage('' as ActivePageType)
      setCurrentTab('' as CurrentTabType)
      setGameQueryValue('')
      setAchievementQueryValue('')

      localStorage.removeItem('sortStyle')
      localStorage.removeItem('userSummary')
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (clearLocalStorageData):', error)
      logEvent(`[Error] in (clearLocalStorageData): ${error}`)
    }
  }

  return {
    isOpen,
    onOpenChange,
    activePage,
    setActivePage,
    openConfirmation,
    handleLogout,
  }
}
