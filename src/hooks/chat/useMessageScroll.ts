import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { UserSummary } from '@/types'
import type { RefObject } from 'react'

import { useCallback, useEffect, useState } from 'react'

interface UseMessageScrollParams {
  messages: ChatMessageType[]
  messagesEndRef: RefObject<HTMLDivElement>
  messagesContainerRef: RefObject<HTMLDivElement>
  userSummary: UserSummary
  loading: boolean
}

export function useMessageScroll({ messages, messagesEndRef, messagesContainerRef, loading }: UseMessageScrollParams): {
  shouldScrollToBottom: boolean
  setShouldScrollToBottom: React.Dispatch<React.SetStateAction<boolean>>
  scrollToBottom: () => void
} {
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messagesEndRef])

  useEffect(() => {
    if (!loading && messages.length > 0 && shouldScrollToBottom) {
      scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [loading, messages, scrollToBottom, shouldScrollToBottom])

  // Handle auto-scrolling for new messages
  useEffect(() => {
    if (messages.length === 0) return

    // Auto-scroll if near bottom
    const container = messagesContainerRef.current
    if (container) {
      const threshold = 150
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
      if (isAtBottom) {
        requestAnimationFrame(() => {
          scrollToBottom()
        })
      }
    }
  }, [messages, messagesContainerRef, scrollToBottom])

  return {
    shouldScrollToBottom,
    setShouldScrollToBottom,
    scrollToBottom,
  }
}
