import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { useEffect, useState } from 'react'

import { useSupabase } from '@/components/contexts/SupabaseContext'

interface UseMessagePaginationParams {
  messagesContainerRef: RefObject<HTMLDivElement>
  setMessages: Dispatch<SetStateAction<ChatMessageType[]>>
  setShouldScrollToBottom: Dispatch<SetStateAction<boolean>>
}

export function useMessagePagination({
  messagesContainerRef,
  setMessages,
  setShouldScrollToBottom,
}: UseMessagePaginationParams): {
  loading: boolean
  hasMore: boolean
  pagination: { limit: number; offset: number }
  setPagination: Dispatch<SetStateAction<{ limit: number; offset: number }>>
} {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [pagination, setPagination] = useState({ limit: 25, offset: 0 })

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
  }, [messagesContainerRef, hasMore, loading, pagination, setMessages, supabase, setShouldScrollToBottom])

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
  }, [pagination, supabase, setMessages, setShouldScrollToBottom])

  return {
    loading,
    hasMore,
    pagination,
    setPagination,
  }
}
