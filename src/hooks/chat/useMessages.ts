import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { UserSummary } from '@/types'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { useEffect } from 'react'

import { useSupabase } from '@/components/contexts/SupabaseContext'
import { useMessageEditing } from '@/hooks/chat/useMessageEditing'
import { useMessageOperations } from '@/hooks/chat/useMessageOperations'
import { useMessagePagination } from '@/hooks/chat/useMessagePagination'
import { useMessageScroll } from '@/hooks/chat/useMessageScroll'
import { logEvent } from '@/utils/tasks'

export type { ChatMessageType }

interface UseMessagesParams {
  userSummary: UserSummary
  userRoles: { [key: string]: string }
  messagesEndRef: RefObject<HTMLDivElement>
  messagesContainerRef: RefObject<HTMLDivElement>
  inputRef: RefObject<HTMLTextAreaElement>
  pinnedMessageId: string | null
  setPinnedMessage: Dispatch<SetStateAction<ChatMessageType | null>>
}

export function useMessages({
  userSummary,
  userRoles,
  messagesEndRef,
  messagesContainerRef,
  inputRef,
  pinnedMessageId,
  setPinnedMessage,
}: UseMessagesParams): {
  messages: ChatMessageType[]
  setMessages: Dispatch<SetStateAction<ChatMessageType[]>>
  loading: boolean
  hasMore: boolean
  pagination: { limit: number; offset: number }
  setPagination: Dispatch<SetStateAction<{ limit: number; offset: number }>>
  shouldScrollToBottom: boolean
  setShouldScrollToBottom: Dispatch<SetStateAction<boolean>>
  handleSendMessage: (message: string, replyToId?: string | null) => Promise<void>
  handleDeleteMessage: (msgId: string, msgUserId: string) => Promise<string | null | void>
  handleEditMessage: (msgId: string, newContent: string) => Promise<void>
  editingMessageId: string | null
  setEditingMessageId: Dispatch<SetStateAction<string | null>>
  editedMessage: string
  setEditedMessage: Dispatch<SetStateAction<string>>
  handleEditLastMessage: () => void
  groupMessagesByDate: (msgs: ChatMessageType[]) => { [key: string]: ChatMessageType[] }
  scrollToBottom: () => void
  isBanned: boolean
} {
  const { messages, setMessages, isBanned } = useSupabase()

  const { shouldScrollToBottom, setShouldScrollToBottom, scrollToBottom } = useMessageScroll({
    messages,
    messagesEndRef,
    messagesContainerRef,
    userSummary,
    loading: false,
  })

  const { loading, hasMore, pagination, setPagination } = useMessagePagination({
    messagesContainerRef,
    setMessages,
    setShouldScrollToBottom,
  })

  const { handleSendMessage, handleDeleteMessage, handleEditMessage } = useMessageOperations({
    userSummary,
    userRoles,
    messages,
    setMessages,
    setShouldScrollToBottom,
    pagination,
  })

  const { editingMessageId, setEditingMessageId, editedMessage, setEditedMessage, handleEditLastMessage } =
    useMessageEditing({
      messages,
      userSummary,
      inputRef,
      messagesContainerRef,
    })

  const groupMessagesByDate = (msgs: ChatMessageType[]): { [key: string]: ChatMessageType[] } => {
    try {
      // Sort all messages by created_at ascending
      const sortedMsgs = [...msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const groups: { [key: string]: ChatMessageType[] } = {}
      sortedMsgs.forEach(msg => {
        const date = new Date(msg.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
        if (!groups[date]) groups[date] = []
        groups[date].push(msg)
      })
      // Ensure each group is sorted by created_at as well
      Object.keys(groups).forEach(date => {
        groups[date].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      })
      return groups
    } catch (error) {
      console.error('Error in groupMessagesByDate:', error)
      logEvent(`[Error] in groupMessagesByDate: ${error}`)
      return {}
    }
  }

  // Scroll to bottom and focus main input if ESC key press if not editing a message
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent): void => {
      // Only handle ESC if we're not editing a message
      if (e.key === 'Escape' && !editingMessageId) {
        scrollToBottom()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleEscapeKey)
    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [editingMessageId, scrollToBottom, inputRef])

  useEffect(() => {
    if (!pinnedMessageId) {
      setPinnedMessage(null)
      return
    }
    const localMsg = messages.find(m => m.id === pinnedMessageId)
    if (localMsg) {
      setPinnedMessage(localMsg)
    }
  }, [pinnedMessageId, messages, setPinnedMessage])

  return {
    messages,
    setMessages,
    loading,
    hasMore,
    pagination,
    setPagination,
    shouldScrollToBottom,
    setShouldScrollToBottom,
    handleSendMessage,
    handleDeleteMessage,
    handleEditMessage,
    editingMessageId,
    setEditingMessageId,
    editedMessage,
    setEditedMessage,
    handleEditLastMessage,
    groupMessagesByDate,
    scrollToBottom,
    isBanned,
  }
}
