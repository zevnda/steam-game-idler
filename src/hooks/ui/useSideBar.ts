import type { ActivePageType, CurrentTabType } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useDisclosure } from '@heroui/react'
import { useNavigationStore } from '@/stores/navigationStore'
import { useSearchStore } from '@/stores/searchStore'
import { useUserStore } from '@/stores/userStore'
import { useTranslation } from 'react-i18next'

import { logEvent } from '@/utils/tasks'
import { showDangerToast } from '@/utils/toasts'

interface SideBarHook {
  isOpen: boolean
  onOpenChange: () => void
  activePage: ActivePageType
  setActivePage: Dispatch<SetStateAction<ActivePageType>>
  openConfirmation: () => void
  handleLogout: (onClose: () => void) => Promise<void>
}

export default function useSideBar(
  activePage: ActivePageType,
  setActivePage: Dispatch<SetStateAction<ActivePageType>>,
): SideBarHook {
  const { t } = useTranslation()
  const { setGameQueryValue, setAchievementQueryValue } = useSearchStore()
  const { setCurrentTab } = useNavigationStore()
  const { userSummary, setUserSummary } = useUserStore()
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
