import type { ActivePageType, CurrentTabType } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useDisclosure } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useSearchContext } from '@/components/contexts/SearchContext'
import { useUserContext } from '@/components/contexts/UserContext'
import { logEvent } from '@/utils/tasks'
import { showDangerToast } from '@/utils/toasts'

interface SideBarHook {
  isOpen: boolean
  onOpenChange: () => void
  activePage: ActivePageType
  setActivePage: Dispatch<SetStateAction<ActivePageType>>
  openConfirmation: () => void
  handleLogout: (onClose: () => void) => Promise<void>
  hasUnreadChat: boolean
  setHasUnreadChat: Dispatch<SetStateAction<boolean>>
  hasBeenMentionedSinceLastRead: boolean
  setHasBeenMentionedSinceLastRead: Dispatch<SetStateAction<boolean>>
}

export default function useSideBar(
  activePage: ActivePageType,
  setActivePage: Dispatch<SetStateAction<ActivePageType>>,
): SideBarHook {
  const { t } = useTranslation()
  const { setGameQueryValue, setAchievementQueryValue } = useSearchContext()
  const { setCurrentTab } = useNavigationContext()
  const { userSummary, setUserSummary } = useUserContext()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [hasUnreadChat, setHasUnreadChat] = useState(false)
  const [hasBeenMentionedSinceLastRead, setHasBeenMentionedSinceLastRead] = useState(false)

  const openConfirmation = (): void => {
    onOpen()
  }

  // Reset mention state when chat is checked
  useEffect(() => {
    if (activePage === 'chat') {
      setHasBeenMentionedSinceLastRead(false)
    }
  }, [activePage])

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
    hasUnreadChat,
    setHasUnreadChat,
    hasBeenMentionedSinceLastRead,
    setHasBeenMentionedSinceLastRead,
  }
}
