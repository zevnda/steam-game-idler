import type { InvokeSettings } from '@/shared/types'
import type { Dispatch, SetStateAction } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { useDisclosure } from '@heroui/react'
import { useUserStore } from '@/shared/stores/userStore'
import { logEvent } from '@/shared/utils/tasks'
import { showDangerToast, showSuccessToast } from '@/shared/utils/toasts'

interface ResetSettingsHook {
  handleResetSettings: (
    onClose: () => void,
    setRefreshKey: Dispatch<SetStateAction<number>>,
  ) => Promise<void>
  isOpen: boolean
  onOpen: () => void
  onOpenChange: () => void
}

export default function useResetSettings(): ResetSettingsHook {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // Reset settings to default
  const handleResetSettings = async (
    onClose: () => void,
    setRefreshKey: Dispatch<SetStateAction<number>>,
  ): Promise<void> => {
    try {
      const response = await invoke<InvokeSettings>('reset_user_settings', {
        steamId: userSummary?.steamId,
      })
      setUserSettings(response.settings)
      setRefreshKey(prevKey => prevKey + 1)
      showSuccessToast(t('toast.resetSettings.success'))
      logEvent('[Settings] Reset to default')
      onClose()
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (handleResetSettings):', error)
      logEvent(`[Error] in (handleResetSettings): ${error}`)
    }
  }

  return { handleResetSettings, isOpen, onOpen, onOpenChange }
}
