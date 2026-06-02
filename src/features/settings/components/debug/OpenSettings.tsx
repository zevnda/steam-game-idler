import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { TbFolders } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores'

export function OpenSettings() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)

  const handleOpen = async () => {
    try {
      await invoke('open_file_explorer', { path: `${userSummary?.steamId}\\settings.json` })
    } catch (error) {
      toast.danger(t('common.error'))
      await logEvent(`[Error] in (handleOpenSettingsFile): ${error}`)
    }
  }

  return (
    <Button
      size='sm'
      className='bg-btn-secondary text-btn-text font-bold'
      radius='full'
      onPress={handleOpen}
      startContent={<TbFolders size={20} />}
    >
      {t('settings.debug.viewSettingsFile')}
    </Button>
  )
}
