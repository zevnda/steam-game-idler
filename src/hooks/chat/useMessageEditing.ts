import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { UserSummary } from '@/types'
import type { RefObject } from 'react'

import { useCallback, useEffect, useState } from 'react'

import { logEvent } from '@/utils/tasks'

interface UseMessageEditingParams {
  messages: ChatMessageType[]
  userSummary: UserSummary
  inputRef: RefObject<HTMLTextAreaElement>
  messagesContainerRef: RefObject<HTMLDivElement>
}

export function useMessageEditing({ messages, userSummary, inputRef, messagesContainerRef }: UseMessageEditingParams): {
  editingMessageId: string | null
  setEditingMessageId: React.Dispatch<React.SetStateAction<string | null>>
  editedMessage: string
  setEditedMessage: React.Dispatch<React.SetStateAction<string>>
  handleEditLastMessage: () => void
} {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessage, setEditedMessage] = useState('')

  const handleEditLastMessage = useCallback((): void => {
    try {
      const steamId = userSummary?.steamId ?? ''
      const lastMsg = [...messages].reverse().find(m => m.user_id === steamId)
      if (lastMsg) {
        setEditingMessageId(lastMsg.id)
        setEditedMessage(lastMsg.message)
        // Scroll the message into view after a brief delay to ensure textarea is rendered
        setTimeout(() => {
          const messageElement = document.querySelector(`[data-message-id="${lastMsg.id}"]`)
          if (messageElement && messagesContainerRef?.current) {
            const container = messagesContainerRef.current
            const messageRect = messageElement.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()

            // Check if message is partially or fully out of view
            const isOutOfView = messageRect.bottom > containerRect.bottom || messageRect.top < containerRect.top

            if (isOutOfView) {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error in handleEditLastMessage:', error)
      logEvent(`[Error] in handleEditLastMessage: ${error}`)
    }
  }, [messages, userSummary, messagesContainerRef])

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
