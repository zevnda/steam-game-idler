import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { UserSummary } from '@/types'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { addToast } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'

import { useSupabase } from '@/components/contexts/SupabaseContext'
import { playMentionBeep } from '@/utils/tasks'

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
  handleSendMessage: (message: string) => Promise<void>
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
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [pagination, setPagination] = useState({ limit: 25, offset: 0 })
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessage, setEditedMessage] = useState('')

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = async (): Promise<void> => {
      if (container.scrollTop === 0 && hasMore && !loading) {
        // Find the oldest message of the current batch before loading more
        const messageElements = container.querySelectorAll('[data-message-id]')
        let oldestMessageId: string | null = null
        if (messageElements.length > 0) {
          oldestMessageId = messageElements[0].getAttribute('data-message-id')
        }

        const newOffset = pagination.offset + pagination.limit
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .range(newOffset, newOffset + pagination.limit - 1)
        if (!error && data && data.length > 0) {
          const olderMessages = data.reverse() as ChatMessageType[]
          setMessages(current => {
            const currentIds = new Set(current.map(m => m.id))
            const uniqueOlder = olderMessages.filter((m: ChatMessageType) => !currentIds.has(m.id))
            return [...uniqueOlder, ...current]
          })
          setPagination(prev => ({ ...prev, offset: newOffset }))
          setHasMore(data.length === pagination.limit)
          setTimeout(() => {
            // After new messages are loaded, scroll to the previous oldest message
            if (oldestMessageId) {
              const oldestMsgElem = container.querySelector(`[data-message-id="${oldestMessageId}"]`)
              if (oldestMsgElem && oldestMsgElem instanceof HTMLElement) {
                const top = oldestMsgElem.offsetTop
                const offset = 50 // px, adjust as needed for header/margin
                container.scrollTop = top - offset
              }
            }
          }, 0)
          setShouldScrollToBottom(false)
        }
      }
    }
    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [messagesContainerRef, hasMore, loading, pagination, setMessages, supabase])

  const handleEditMessage = async (msgId: string, newContent: string): Promise<void> => {
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return
    const steamId = userSummary?.steamId ?? ''
    const userRole = steamId ? userRoles[steamId] : 'user'
    const canEditAny = userRole === 'admin' || userRole === 'mod'
    if (msg.user_id !== steamId && !canEditAny) {
      addToast({
        title: 'You can only edit your own messages.',
        color: 'danger',
      })
      return
    }
    if (!newContent.trim()) {
      // If the new content is empty or whitespace, delete the message
      await handleDeleteMessage(msgId, msg.user_id)
      return
    }
    const { error } = await supabase.from('messages').update({ message: newContent }).eq('id', msgId)
    if (error) {
      addToast({ title: 'Error editing message', color: 'danger' })
    } else {
      setMessages(current => current.map(m => (m.id === msgId ? { ...m, message: newContent } : m)))
    }
  }

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

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messagesEndRef])

  useEffect(() => {
    if (!loading && messages.length > 0 && shouldScrollToBottom) {
      scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [loading, messages, scrollToBottom, shouldScrollToBottom])

  useEffect(() => {
    const fetchMessages = async (): Promise<void> => {
      setLoading(true)
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1)
      if (error) {
        setLoading(false)
        return
      } else {
        const newMessages = ((data || []) as ChatMessageType[]).reverse()
        setMessages(current => {
          if (pagination.offset === 0) {
            setShouldScrollToBottom(true)
            return newMessages
          } else {
            const currentIds = new Set(current.map(m => m.id))
            const uniqueOlder = newMessages.filter((m: ChatMessageType) => !currentIds.has(m.id))
            return [...uniqueOlder, ...current]
          }
        })
        setHasMore((count ?? 0) > pagination.offset + pagination.limit)
      }
      setLoading(false)
    }
    fetchMessages()
    // Note: Real-time subscriptions are now handled by SupabaseContext
  }, [pagination, supabase, setMessages, setShouldScrollToBottom, setHasMore])

  // Handle mention beeps and auto-scrolling for new messages
  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    // Check if message mentions current user
    if (userSummary?.personaName && lastMessage.message.includes(`@${userSummary.personaName}`)) {
      playMentionBeep()
    }

    // Auto-scroll if near bottom
    const container = messagesContainerRef.current
    if (container) {
      const threshold = 10
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
      if (isAtBottom) {
        setTimeout(() => setShouldScrollToBottom(true), 0)
      }
    }
  }, [messages, userSummary?.personaName, messagesContainerRef, setShouldScrollToBottom])

  const handleSendMessage = async (message: string): Promise<void> => {
    if (!message.trim()) return
    const steamId = userSummary?.steamId || crypto.randomUUID()

    // Upsert user to 'users' table before sending message
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id,username,avatar_url')
      .eq('user_id', steamId)
      .single()

    const currentUsername = userSummary?.personaName || 'Unknown'

    if (!existingUser) {
      // User does not exist, insert new
      await supabase.from('users').insert([
        {
          user_id: steamId,
          username: currentUsername,
          avatar_url: userSummary?.avatar || null,
          role: null,
        },
      ])
    } else if (
      !existingUser.username ||
      existingUser.username !== currentUsername ||
      existingUser.avatar_url !== (userSummary?.avatar || null)
    ) {
      // User exists but username or avatar is missing or changed, update
      await supabase
        .from('users')
        .update({
          username: currentUsername,
          avatar_url: userSummary?.avatar || null,
        })
        .eq('user_id', steamId)
    }

    const tempId = `temp-${Date.now()}`
    const tempMessage = {
      id: tempId,
      user_id: steamId,
      username: userSummary?.personaName || 'Unknown',
      message,
      created_at: new Date().toISOString(),
      avatar_url: userSummary?.avatar || undefined,
    }
    setMessages(prev => {
      // Add new message, then trim to latest pagination.limit messages
      const updated = [...prev, tempMessage]
      return updated.length > pagination.limit ? updated.slice(updated.length - pagination.limit) : updated
    })
    setShouldScrollToBottom(true)
    const payload = {
      user_id: steamId,
      username: userSummary?.personaName || 'Unknown',
      message,
      avatar_url: userSummary?.avatar || undefined,
    }
    const { error } = await supabase.from('messages').insert([payload])
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  const handleDeleteMessage = async (msgId: string, msgUserId: string): Promise<string | null | void> => {
    const steamId = userSummary?.steamId ?? ''
    const userRole = steamId ? userRoles[steamId] : 'user'
    const canDeleteAny = userRole === 'admin' || userRole === 'mod'
    if (msgUserId !== steamId && !canDeleteAny) {
      return addToast({
        title: 'You can only delete your own messages.',
        color: 'danger',
      })
    }
    const { error } = await supabase.from('messages').delete().eq('id', msgId)
    if (!error) {
      setMessages(current => current.filter(msg => msg.id !== msgId))
    }
  }

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
