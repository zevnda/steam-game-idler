import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

interface TypingUser {
  user_id: string
  username: string
}

export function useTypingUsers(currentUser: TypingUser): {
  typingUsers: TypingUser[]
  broadcastTyping: () => void
  broadcastStopTyping: () => void
} {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const channel = supabase.channel('chat-typing')
    channelRef.current = channel
    channel
      .on('broadcast', { event: 'typing' }, payload => {
        setTypingUsers(prev => {
          const exists = prev.some(u => u.user_id === payload.payload.user_id)
          if (!exists) {
            return [...prev, payload.payload]
          }
          return prev
        })
      })
      .on('broadcast', { event: 'stop_typing' }, payload => {
        setTypingUsers(prev => prev.filter(u => u.user_id !== payload.payload.user_id))
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Broadcast typing event
  const broadcastTyping = (): void => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: currentUser,
      })
    }
    // Add self locally
    setTypingUsers(prev => {
      const exists = prev.some(u => u.user_id === currentUser.user_id)
      if (!exists) {
        return [...prev, currentUser]
      }
      return prev
    })
    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    // After 3s of inactivity, broadcast stop_typing
    timeoutRef.current = setTimeout(() => {
      broadcastStopTyping()
    }, 3000)
  }

  // Broadcast stop_typing immediately
  const broadcastStopTyping = (): void => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: currentUser,
      })
    }
    // Remove self locally
    setTypingUsers(prev => prev.filter(u => u.user_id !== currentUser.user_id))
  }

  return { typingUsers, broadcastTyping, broadcastStopTyping }
}
