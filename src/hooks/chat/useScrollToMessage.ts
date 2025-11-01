import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { useCallback } from 'react'

import { useSupabase } from '@/components/contexts/SupabaseContext'

interface UseScrollToMessageParams {
  messages: ChatMessageType[]
  setMessages: Dispatch<SetStateAction<ChatMessageType[]>>
  messagesContainerRef: RefObject<HTMLDivElement>
  pagination: { limit: number; offset: number }
}

export function useScrollToMessage({
  messages,
  setMessages,
  messagesContainerRef,
  pagination,
}: UseScrollToMessageParams): {
  scrollToMessage: (messageId: string) => Promise<void>
} {
  const { supabase } = useSupabase()

  const scrollToMessage = useCallback(
    async (messageId: string): Promise<void> => {
      const container = messagesContainerRef.current
      if (!container) return

      // First, check if the message is already in the DOM
      const messageElement = container.querySelector(`[data-message-id="${messageId}"]`)

      if (messageElement && messageElement instanceof HTMLElement) {
        // Message is already visible, just scroll to it
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Add highlight effect
        messageElement.classList.add('message-highlight')
        setTimeout(() => {
          messageElement.classList.remove('message-highlight')
        }, 2000)
        return
      }

      // Message not in current view, need to fetch it
      const { data: targetMessage, error } = await supabase.from('messages').select('*').eq('id', messageId).single()

      if (error || !targetMessage) {
        console.error('Message not found:', error)
        return
      }

      // Store current messages before loading older ones
      const currentMessages = [...messages]

      // Get messages around the target message (centered view)
      const halfLimit = Math.floor(pagination.limit / 2)
      const { data: olderMessages } = await supabase
        .from('messages')
        .select('*')
        .lte('created_at', targetMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(halfLimit + 1)

      const { data: newerMessages } = await supabase
        .from('messages')
        .select('*')
        .gt('created_at', targetMessage.created_at)
        .order('created_at', { ascending: true })
        .limit(halfLimit)

      if (!olderMessages) {
        console.error('Error fetching messages')
        return
      }

      // Combine messages around the target
      const contextMessages = [...olderMessages.reverse(), ...(newerMessages || [])]

      // Merge with current messages, avoiding duplicates
      const currentMessageIds = new Set(currentMessages.map(m => m.id))
      const newMessages = contextMessages.filter(m => !currentMessageIds.has(m.id))

      // Add new messages to the state without replacing current ones
      setMessages(prev => {
        const allMessages = [...prev, ...newMessages]
        // Sort by created_at to maintain order
        return allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      })

      // Wait for DOM to update using a polling mechanism
      const attemptScroll = (attempts = 0): void => {
        if (attempts > 20) {
          // Give up after 20 attempts (2 seconds)
          console.error('Could not find message element after loading')
          return
        }

        const messageElement = container.querySelector(`[data-message-id="${messageId}"]`)
        if (messageElement && messageElement instanceof HTMLElement) {
          // Found the element, wait a bit more for layout to settle before scrolling
          setTimeout(() => {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

            // Add highlight effect
            messageElement.classList.add('message-highlight')
            setTimeout(() => {
              messageElement.classList.remove('message-highlight')
            }, 2000)
          }, 150)
        } else {
          // Element not in DOM yet, try again
          setTimeout(() => attemptScroll(attempts + 1), 100)
        }
      }

      // Start attempting to scroll
      setTimeout(() => attemptScroll(), 50)
    },
    [messages, setMessages, messagesContainerRef, pagination, supabase],
  )

  return {
    scrollToMessage,
  }
}
