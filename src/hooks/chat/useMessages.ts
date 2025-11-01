import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { UserSummary } from '@/types'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { useEffect } from 'react'

import { useSupabase } from '@/components/contexts/SupabaseContext'
import { useMessageEditing } from '@/hooks/chat/useMessageEditing'
import { useMessageOperations } from '@/hooks/chat/useMessageOperations'
import { useMessagePagination } from '@/hooks/chat/useMessagePagination'
import { useMessageScroll } from '@/hooks/chat/useMessageScroll'

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
  const { messages, setMessages, isBanned, supabase } = useSupabase()

  const { shouldScrollToBottom, setShouldScrollToBottom, scrollToBottom } = useMessageScroll({
    messages,
    messagesEndRef,
    messagesContainerRef,
    userSummary,
    loading: false, // will be updated from pagination hook
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
    })

  const groupMessagesByDate = (msgs: ChatMessageType[]): { [key: string]: ChatMessageType[] } => {
    const groups: { [key: string]: ChatMessageType[] } = {}
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

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

  useEffect(() => {
    // Update last_active timestamp for current user every 30 seconds
    let interval: NodeJS.Timeout | undefined
    if (userSummary?.steamId) {
      const updateLastActive = async (): Promise<void> => {
        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', userSummary.steamId)
      }
      updateLastActive()
      interval = setInterval(updateLastActive, 30000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [userSummary?.steamId, supabase])

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
