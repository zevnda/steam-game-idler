import { useDisclosure } from '@heroui/react'
import { handleClearLogs } from '@/features/settings/debug/hooks/useLogs'
import { useUserStore } from '@/shared/stores/userStore'
import { logEvent, preserveKeysAndClearData } from '@/shared/utils/tasks'

interface ClearDataHook {
  isOpen: boolean
  onOpen: () => void
  onOpenChange: () => void
  handleClearData: (onClose: () => void) => void
}

const useClearData = (): ClearDataHook => {
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // Clear all data
  const handleClearData = (onClose: () => void): void => {
    onClose()
    handleClearLogs(false)
    preserveKeysAndClearData()
    setUserSummary(null)
    logEvent('[Settings] Cleared all data successfully')
  }

  return {
    isOpen,
    onOpen,
    onOpenChange,
    handleClearData,
  }
}

export default useClearData
