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
    const container = messagesContainerRef.current
    if (!container) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      return
    }

    // Wait for both images to load AND DOM to be fully rendered (including reply previews)
    const performScroll = (): void => {
      // Wait for any images to load before scrolling
      const images = container.querySelectorAll('img')
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) {
          return Promise.resolve()
        }
        return new Promise<void>(resolve => {
          img.onload = () => resolve()
          img.onerror = () => resolve() // Resolve even on error to not block scroll
          // Timeout after 3 seconds to prevent infinite waiting
          setTimeout(() => resolve(), 3000)
        })
      })

      if (imagePromises.length > 0) {
        Promise.all(imagePromises).then(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        })
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }
    }

    // Use requestAnimationFrame to ensure React has finished rendering
    // This gives reply previews and other dynamic content time to render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performScroll()
      })
    })
  }, [messagesEndRef, messagesContainerRef])

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
