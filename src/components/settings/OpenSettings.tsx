import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbFolders } from 'react-icons/tb'

import { useUserContext } from '@/components/contexts/UserContext'
import { logEvent } from '@/utils/tasks'
import { showDangerToast } from '@/utils/toasts'

export default function OpenSettings(): ReactElement {
  const { t } = useTranslation()
  const { userSummary } = useUserContext()

  // Open the log file in file explorer
  const handleOpenSettingsFile = async (): Promise<void> => {
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
