import type { ChatMessageType } from '@/components/chat/SupabaseContext'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { useEffect, useState } from 'react'

import { useSupabase } from '@/components/chat/SupabaseContext'
import { logEvent } from '@/utils/tasks'

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
  // Initial load: 35 messages, subsequent paginations: 10 messages, max 2 paginations
  const INITIAL_LIMIT = 35
  const PAGINATION_LIMIT = 10
  const MAX_PAGINATIONS = 2
  const [pagination, setPagination] = useState({ limit: INITIAL_LIMIT, offset: 0 })
  const [paginationCount, setPaginationCount] = useState(0)

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = async (): Promise<void> => {
      try {
        // Only allow paginating up to MAX_PAGINATIONS times
        if (container.scrollTop === 0 && hasMore && !loading && paginationCount < MAX_PAGINATIONS) {
          // Find the oldest message of the current batch before loading more
          const messageElements = container.querySelectorAll('[data-message-id]')
          let oldestMessageId: string | null = null
          if (messageElements.length > 0) {
            oldestMessageId = messageElements[0].getAttribute('data-message-id')
          }

          // Always fetch the next batch after the last offset + limit
          const nextOffset = pagination.offset + pagination.limit
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .range(nextOffset, nextOffset + PAGINATION_LIMIT - 1)
          if (error) {
            console.error('Error loading more messages:', error)
            logEvent(`[Error] in loadMoreMessages: ${error.message}`)
            return
          }
          if (data && data.length > 0) {
            let olderMessages = data.reverse() as ChatMessageType[]

            // Fetch reply data for messages that have reply_to_id
            const messageIds = olderMessages.filter(m => m.reply_to_id).map(m => m.reply_to_id)
            if (messageIds.length > 0) {
              const { data: replyMessages, error: replyError } = await supabase
                .from('messages')
                .select('*')
                .in('id', messageIds)

              if (!replyError && replyMessages) {
                // Map reply messages to their IDs
                const replyMap = new Map(replyMessages.map(msg => [msg.id, msg]))
                // Attach reply data to messages
                olderMessages = olderMessages.map(msg => {
                  if (msg.reply_to_id && replyMap.has(msg.reply_to_id)) {
                    return { ...msg, reply_to: replyMap.get(msg.reply_to_id) as ChatMessageType }
                  }
                  return msg
                })
              }
            }

            setMessages(current => {
              const currentIds = new Set(current.map(m => m.id))
              const uniqueOlder = olderMessages.filter((m: ChatMessageType) => !currentIds.has(m.id))
              return [...uniqueOlder, ...current]
            })
            setPagination({ limit: PAGINATION_LIMIT, offset: nextOffset })
            setPaginationCount(prev => prev + 1)
            setHasMore(data.length === PAGINATION_LIMIT)
            setShouldScrollToBottom(false)

            // Use requestAnimationFrame to ensure DOM is fully updated before restoring scroll
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // After new messages are loaded, scroll to the previous oldest message
                if (oldestMessageId) {
                  const oldestMsgElem = container.querySelector(`[data-message-id="${oldestMessageId}"]`)
                  if (oldestMsgElem && oldestMsgElem instanceof HTMLElement) {
                    const top = oldestMsgElem.offsetTop
                    const offset = 50
                    container.scrollTop = top - offset
                  }
                }
              })
            })
          }
        }
      } catch (error) {
        console.error('Error in handleScroll:', error)
        logEvent(`[Error] in handleScroll (pagination): ${error}`)
      }
    }
    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [
    messagesContainerRef,
    hasMore,
    loading,
    pagination,
    paginationCount,
    setMessages,
    supabase,
    setShouldScrollToBottom,
  ])

  useEffect(() => {
    const fetchMessages = async (): Promise<void> => {
      try {
        setLoading(true)
        const { data, error, count } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(pagination.offset, pagination.offset + pagination.limit - 1)
        if (error) {
          console.error('Error fetching messages:', error)
          logEvent(`[Error] in fetchMessages: ${error.message}`)
          setLoading(false)
          return
        } else {
          let newMessages = ((data || []) as ChatMessageType[]).reverse()

          // Fetch reply data for messages that have reply_to_id
          const messageIds = newMessages.filter(m => m.reply_to_id).map(m => m.reply_to_id)
          if (messageIds.length > 0) {
            const { data: replyMessages, error: replyError } = await supabase
              .from('messages')
              .select('*')
              .in('id', messageIds)

            if (!replyError && replyMessages) {
              // Map reply messages to their IDs
              const replyMap = new Map(replyMessages.map(msg => [msg.id, msg]))
              // Attach reply data to messages
              newMessages = newMessages.map(msg => {
                if (msg.reply_to_id && replyMap.has(msg.reply_to_id)) {
                  return { ...msg, reply_to: replyMap.get(msg.reply_to_id) as ChatMessageType }
                }
                return msg
              })
            }
          }

          setMessages(current => {
            if (pagination.offset === 0) {
              setShouldScrollToBottom(true)
              // For initial load, use requestAnimationFrame to ensure DOM is ready
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setShouldScrollToBottom(true)
                })
              })
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
      } catch (error) {
        console.error('Error in fetchMessages:', error)
        logEvent(`[Error] in fetchMessages: ${error}`)
        setLoading(false)
      }
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
