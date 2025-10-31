import type { UserSummary } from '@/types'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { addToast } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

export interface ChatMessageType {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  avatar_url?: string
  // Add other fields if needed
}

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
} {
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [messages, setMessages] = useState<ChatMessageType[]>([])
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
        const prevScrollHeight = container.scrollHeight
        const newOffset = pagination.offset + pagination.limit
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .range(newOffset, newOffset + pagination.limit - 1)
        if (!error && data && data.length > 0) {
          const olderMessages = data.reverse()
          setMessages(current => {
            const currentIds = new Set(current.map(m => m.id))
            const uniqueOlder = olderMessages.filter(m => !currentIds.has(m.id))
            return [...uniqueOlder, ...current]
          })
          setPagination(prev => ({ ...prev, offset: newOffset }))
          setHasMore(data.length === pagination.limit)
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - prevScrollHeight
          }, 0)
          setShouldScrollToBottom(false)
        }
      }
    }
    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [messagesContainerRef, hasMore, loading, pagination])

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

  useEffect(() => {
    // ...existing code for user roles fetch, not needed here...
  }, [])

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
    // ...existing code for MOTD fetch, not needed here...
  }, [])

  useEffect(() => {
    const fetchMessages = async (): Promise<void> => {
      setLoading(true)
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1)
      if (error) {
        // ...existing code...
      } else {
        const newMessages = ((data || []) as ChatMessageType[]).reverse()
        setMessages(current => {
          if (pagination.offset === 0) {
            setShouldScrollToBottom(true)
            return newMessages
          } else {
            const currentIds = new Set(current.map(m => m.id))
            const uniqueOlder = newMessages.filter(m => !currentIds.has(m.id))
            return [...uniqueOlder, ...current]
          }
        })
        setHasMore((count ?? 0) > pagination.offset + pagination.limit)
      }
      setLoading(false)
    }
    fetchMessages()
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new as ChatMessageType
        const container = messagesContainerRef.current
        setMessages(current => {
          const filtered = current.filter(
            m =>
              !(
                typeof m.id === 'string' &&
                m.id.startsWith('temp-') &&
                m.user_id === newMsg.user_id &&
                m.message === newMsg.message
              ),
          )
          return [...filtered, newMsg]
        })
        // Play mention beep only if the new message mentions the current user
        if (userSummary?.personaName && newMsg.message.includes(`@${userSummary.personaName}`)) {
          playMentionBeep()
        }
        if (container) {
          const threshold = 10
          const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
          if (isAtBottom) {
            setTimeout(() => setShouldScrollToBottom(true), 0)
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const updatedMsg = payload.new as ChatMessageType
        setMessages(current => current.map(m => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        const deletedMsg = payload.old as ChatMessageType
        setMessages(current => current.filter(m => m.id !== deletedMsg.id))
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userSummary?.steamId, userSummary?.personaName, pagination, messagesContainerRef])

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
    setMessages(prev => [...prev, tempMessage])
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

  function playMentionBeep(): void {
    try {
      const AudioCtx =
        window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 1500
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.3)
      oscillator.onended = () => ctx.close()
    } catch {}
  }

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
  }
}
