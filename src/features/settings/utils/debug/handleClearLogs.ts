import i18next from 'i18next'
import { showDangerToast, showSuccessToast } from '@/shared/components'
import { invokeSafe, logEvent } from '@/shared/utils'

export const handleClearLogs = async (log = true) => {
  try {
    await invokeSafe('clear_log_file')
    // Only show toast if log was manually cleared
    if (log) {
      showSuccessToast(i18next.t('toast.clearLogs.success'))
      logEvent('[Settings - Logs] Logs cleared successfully')
    }
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleClearLogs):', error)
    logEvent(`[Error] in (handleClearLogs): ${error}`)
  }
}
