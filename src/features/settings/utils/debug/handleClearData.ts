import type { UserSummary } from '@/shared/types'
import { handleClearLogs } from '@/features/settings'
import { logEvent, preserveKeysAndClearData } from '@/shared/utils'

export const handleClearData = (
  onClose: () => void,
  setUserSummary: (value: UserSummary | ((prev: UserSummary) => UserSummary)) => void,
) => {
  onClose()
  handleClearLogs(false)
  preserveKeysAndClearData()
  setUserSummary(null)
  logEvent('[Settings] Cleared all data successfully')
}
