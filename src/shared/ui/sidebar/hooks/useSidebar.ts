import type { ActivePageType, CurrentTabType } from '@/shared/types'
import type { Dispatch, SetStateAction } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { useDisclosure } from '@heroui/react'
import { useNavigationStore } from '@/shared/stores/navigationStore'
import { useSearchStore } from '@/shared/stores/searchStore'
import { useUserStore } from '@/shared/stores/userStore'
import { logEvent } from '@/shared/utils/tasks'
import { showDangerToast } from '@/shared/utils/toasts'

interface SidebarProps {
  isOpen: boolean
  onOpenChange: () => void
  activePage: ActivePageType
  setActivePage: Dispatch<SetStateAction<ActivePageType>>
  openConfirmation: () => void
  handleLogout: (onClose: () => void) => Promise<void>
}

export default function useSidebar(
  activePage: ActivePageType,
  setActivePage: Dispatch<SetStateAction<ActivePageType>>,
): SidebarProps {
  const { t } = useTranslation()
  const setGameQueryValue = useSearchStore(state => state.setGameQueryValue)
  const setAchievementQueryValue = useSearchStore(state => state.setAchievementQueryValue)
  const setCurrentTab = useNavigationStore(state => state.setCurrentTab)
  const userSummary = useUserStore(state => state.userSummary)
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const openConfirmation = (): void => {
    onOpen()
  }

  // Handle logging out
  const handleLogout = async (onClose: () => void): Promise<void> => {
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
  const clearLocalStorageData = async (): Promise<void> => {
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
