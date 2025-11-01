import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { UserSummary } from '@/types'
import type { RefObject } from 'react'

import { useEffect, useState } from 'react'

interface UseMessageEditingParams {
  messages: ChatMessageType[]
  userSummary: UserSummary
  inputRef: RefObject<HTMLTextAreaElement>
}

export function useMessageEditing({ messages, userSummary, inputRef }: UseMessageEditingParams): {
  editingMessageId: string | null
  setEditingMessageId: React.Dispatch<React.SetStateAction<string | null>>
  editedMessage: string
  setEditedMessage: React.Dispatch<React.SetStateAction<string>>
  handleEditLastMessage: () => void
} {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessage, setEditedMessage] = useState('')

  const handleEditLastMessage = (): void => {
    const steamId = userSummary?.steamId ?? ''
    const lastMsg = [...messages].reverse().find(m => m.user_id === steamId)
    if (lastMsg) {
      setEditingMessageId(lastMsg.id)
      setEditedMessage(lastMsg.message)
    }
  }

  useEffect(() => {
    if (editingMessageId === null) {
      inputRef.current?.focus()
    }
  }, [editingMessageId, inputRef])

  return {
    editingMessageId,
    setEditingMessageId,
    editedMessage,
    setEditedMessage,
    handleEditLastMessage,
  }
}
