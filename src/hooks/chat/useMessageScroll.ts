import type { ChatMessageType } from '@/components/chat/SupabaseContext'
import type { UserSummary } from '@/types'
import type { RefObject } from 'react'

import { useCallback, useEffect, useRef, useState } from 'react'

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
  const hasScrolledOnce = useRef(false)

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messagesEndRef])

  // Immediate scroll on first messages load
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledOnce.current && shouldScrollToBottom) {
      // Use multiple scroll attempts to ensure we get there even as content loads
      const scrollImmediately = (): void => {
        scrollToBottom()
        requestAnimationFrame(() => {
          scrollToBottom()
          requestAnimationFrame(() => {
            scrollToBottom()
          })
        })
      }

      scrollImmediately()
      hasScrolledOnce.current = true

      // Keep trying for 500ms to catch any late-loading content
      const timeoutId = setTimeout(scrollToBottom, 100)
      const timeoutId2 = setTimeout(scrollToBottom, 300)
      const timeoutId3 = setTimeout(scrollToBottom, 500)

      return () => {
        clearTimeout(timeoutId)
        clearTimeout(timeoutId2)
        clearTimeout(timeoutId3)
      }
    }
  }, [messages.length, scrollToBottom, shouldScrollToBottom])

  // Previous behavior for subsequent updates
  useEffect(() => {
    if (!loading && messages.length > 0 && shouldScrollToBottom && hasScrolledOnce.current) {
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
