import type { ActivePageType } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { useDisclosure } from '@heroui/react'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUiStore, useUserStore } from '@/shared/stores'

export function useSidebar(
  activePage: ActivePageType,
  setActivePage: (value: ActivePageType) => void,
) {
  const { t } = useTranslation()
  const setGameQuery = useUiStore(s => s.setGameQuery)
  const setAchievementQuery = useUiStore(s => s.setAchievementQuery)
  const setCurrentTab = useUiStore(s => s.setCurrentTab)
  const userSummary = useUserStore(s => s.userSummary)
  const setUserSummary = useUserStore(s => s.setUserSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const openConfirmation = () => onOpen()

  const handleLogout = async (onClose: () => void) => {
    try {
      onClose()
      setUserSummary(null)
      setActivePage('' as ActivePageType)
      setCurrentTab('achievements')
      setGameQuery('')
      setAchievementQuery('')
      localStorage.removeItem('sortStyle')
      localStorage.removeItem('userSummary')
      await invoke('kill_all_steamutil_processes')
      await logEvent(`[System] Logged out of ${userSummary?.personaName}`)
    } catch (error) {
      toast.danger(t('common.error'))
      console.error('Error in handleLogout:', error)
      await logEvent(`[Error] in (handleLogout): ${error}`)
    }
  }

  return { isOpen, onOpenChange, activePage, setActivePage, openConfirmation, handleLogout }
}
