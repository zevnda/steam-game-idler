import { useDisclosure } from '@heroui/react'
import { handleClearLogs } from '@/features/settings'
import { useUserStore } from '@/shared/stores'
import { logEvent, preserveKeysAndClearData } from '@/shared/utils'

export const useClearData = () => {
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // Clear all data
  const handleClearData = (onClose: () => void) => {
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
