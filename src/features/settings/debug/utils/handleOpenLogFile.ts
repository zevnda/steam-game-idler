import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/ui'
import { logEvent } from '@/shared/utils'

export const handleOpenLogFile = async () => {
  try {
    await invoke('open_file_explorer', { path: 'log.txt' })
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleOpenLogFile):', error)
    logEvent(`[Error] in (handleOpenLogFile): ${error}`)
  }
}
