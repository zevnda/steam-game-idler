import type { ChatMessageType } from '@/hooks/chat/useMessages'
import type { Dispatch, SetStateAction } from 'react'

import { useState } from 'react'

export function usePinnedMessage(): {
  pinnedMessageId: string | null
  pinnedMessage: ChatMessageType | null
  handlePinMessage: (message: ChatMessageType) => void
  handleUnpinMessage: () => void
  setPinnedMessage: Dispatch<SetStateAction<ChatMessageType | null>>
} {
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null)
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessageType | null>(null)

  const handlePinMessage = (message: ChatMessageType): void => {
    setPinnedMessageId(message.id)
    setPinnedMessage(message)
  }

  const handleUnpinMessage = (): void => {
    setPinnedMessageId(null)
    setPinnedMessage(null)
  }

  return {
    pinnedMessageId,
    pinnedMessage,
    handlePinMessage,
    handleUnpinMessage,
    setPinnedMessage,
  }
}
