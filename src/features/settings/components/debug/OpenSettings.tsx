import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { TbFolders } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { showDangerToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { logEvent } from '@/shared/utils'

export const OpenSettings = () => {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)

  // Open the log file in file explorer
  const handleOpenSettingsFile = async () => {
    try {
      const filePath = `${userSummary?.steamId}\\settings.json`
      await invoke('open_file_explorer', { path: filePath })
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (handleOpenSettingsFile):', error)
      logEvent(`[Error] in (handleOpenSettingsFile): ${error}`)
    }
  }

  return (
    <Button
      size='sm'
      className='bg-btn-secondary text-btn-text font-bold'
      radius='full'
      onPress={handleOpenSettingsFile}
      startContent={<TbFolders size={20} />}
    >
      {t('settings.debug.viewSettingsFile')}
    </Button>
  )
}
