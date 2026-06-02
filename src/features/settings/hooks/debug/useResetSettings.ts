import type { InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { useDisclosure } from '@heroui/react'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores'

export function useResetSettings() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const handleResetSettings = async (
    onClose: () => void,
    setRefreshKey: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    try {
      const res = await invoke<InvokeSettings>('reset_user_settings', {
        steamId: userSummary?.steamId,
      })
      setUserSettings(res.settings)
      setRefreshKey(k => k + 1)
      toast.success(t('toast.resetSettings.success'))
      await logEvent('[Settings] Reset to default')
      onClose()
    } catch (error) {
      toast.danger(t('common.error'))
      await logEvent(`[Error] in (handleResetSettings): ${error}`)
    }
  }

  return { handleResetSettings, isOpen, onOpen, onOpenChange }
}
