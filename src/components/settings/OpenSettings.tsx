import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbFolders } from 'react-icons/tb'

import { useUserContext } from '@/components/contexts/UserContext'
import CustomTooltip from '@/components/ui/CustomTooltip'
import { logEvent } from '@/utils/tasks'
import { showDangerToast } from '@/utils/toasts'

export default function OpenSettings(): ReactElement {
  const { t } = useTranslation()
  const { userSummary } = useUserContext()

  // Open the log file in file explorer
  const handleOpenSettingsFile = async (): Promise<void> => {
    try {
      const filePath = `cache\\${userSummary?.steamId}\\settings.json`
      await invoke('open_file_explorer', { path: filePath })
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (handleOpenSettingsFile):', error)
      logEvent(`[Error] in (handleOpenSettingsFile): ${error}`)
    }
  }

  return (
    <CustomTooltip content={t('achievementManager.file')}>
      <Button
        isIconOnly
        size='sm'
        className='font-semibold rounded-lg bg-dynamic text-button-text'
        onPress={handleOpenSettingsFile}
        startContent={<TbFolders size={20} />}
      />
    </CustomTooltip>
  )
}
