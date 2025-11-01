import type { UserSummary } from '@/types'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

import { playMentionBeep } from '@/utils/tasks'

export interface ChatMessageType {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  avatar_url?: string
}

interface TypingUser {
  user_id: string
  username: string
}

interface SupabaseContextType {
  // Messages state
  messages: ChatMessageType[]
  setMessages: Dispatch<SetStateAction<ChatMessageType[]>>

  // User ban status
  isBanned: boolean

  // User roles
  userRoles: { [steamId: string]: string }

  // Chat maintenance mode
  chatMaintenanceMode: boolean

  // Message of the day
  motd: string

  // Online users count (via presence)
  onlineCount: number

  // Typing users
  typingUsers: TypingUser[]
  broadcastTyping: () => void
  broadcastStopTyping: () => void

  // Supabase client (exposing for direct access if needed)
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

interface SupabaseProviderProps {
  children: ReactNode
  userSummary: UserSummary | null
}

export function SupabaseProvider({ children, userSummary }: SupabaseProviderProps): ReactNode {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isBanned, setIsBanned] = useState(false)
  const [userRoles, setUserRoles] = useState<{ [steamId: string]: string }>({})
  const [chatMaintenanceMode, setChatMaintenanceMode] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [motd, setMotd] = useState<string>('')

  const supabaseRef = useRef(
    createClient(
      'https://inbxfhxkrhwiybnephlq.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
    ),
  )

  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const broadcastTyping = (): void => {
    if (!userSummary?.steamId || !channelRef.current) return

    const currentUser = {
      user_id: userSummary.steamId,
      username: userSummary.personaName || 'Unknown',
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: currentUser,
    })

    // Add self locally
    setTypingUsers(prev => {
      const exists = prev.some(u => u.user_id === currentUser.user_id)
      if (!exists) {
        return [...prev, currentUser]
      }
      return prev
    })

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    // After 3s of inactivity, broadcast stop_typing
    typingTimeoutRef.current = setTimeout(() => {
      broadcastStopTyping()
    }, 3000)
  }

  const broadcastStopTyping = (): void => {
    if (!userSummary?.steamId || !channelRef.current) return

    const currentUser = {
      user_id: userSummary.steamId,
      username: userSummary.personaName || 'Unknown',
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: currentUser,
    })

    // Remove self locally
    setTypingUsers(prev => prev.filter(u => u.user_id !== currentUser.user_id))
  }

  useEffect(() => {
    const supabase = supabaseRef.current
    const steamId = userSummary?.steamId

    // Skip in development for maintenance mode
    // const isDevelopment = process.env.NODE_ENV === 'development'
    const isDevelopment = false

    // Fetch initial user roles
    const fetchUserRoles = async (): Promise<void> => {
      const { data, error } = await supabase.from('users').select('user_id,role,is_banned')
      if (!error && data) {
        const roles: { [userId: string]: string } = {}
        data.forEach((user: { user_id: string; role: string; is_banned?: boolean }) => {
          roles[user.user_id] = user.role
        })
        setUserRoles(roles)
      }
    }

    // Fetch initial banned status
    const fetchBannedStatus = async (): Promise<void> => {
      if (!steamId) return
      const { data, error } = await supabase.from('users').select('is_banned').eq('user_id', steamId).single()
      if (!error && data?.is_banned === true) setIsBanned(true)
      else setIsBanned(false)
    }

    // Fetch initial maintenance mode
    const fetchMaintenanceMode = async (): Promise<void> => {
      if (isDevelopment) return
      const { data, error } = await supabase.from('chat_settings').select('maintenance').maybeSingle()
      if (!error && typeof data?.maintenance === 'boolean') {
        setChatMaintenanceMode(data.maintenance)
      }
    }

    // Fetch initial MOTD
    const fetchMotd = async (): Promise<void> => {
      const { data, error } = await supabase.from('chat_settings').select('motd').maybeSingle()
      if (!error && typeof data?.motd === 'string') {
        setMotd(data.motd)
      }
    }

    fetchUserRoles()
    fetchBannedStatus()
    fetchMaintenanceMode()
    fetchMotd()

    // Create ONE unified channel for everything
    const channel = supabase.channel('unified-chat-channel', {
      config: {
        presence: {
          key: steamId || 'anonymous',
        },
      },
    })

    channelRef.current = channel

    channel
      // 1. Listen for user role changes (from useUserRoles)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () => {
        fetchUserRoles()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, payload => {
        fetchUserRoles()
        // Also check if current user's ban status changed (from useMessages)
        if (payload.new?.user_id === steamId) {
          setIsBanned(payload.new?.is_banned === true)
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'users' }, () => {
        fetchUserRoles()
      })
      // 2. Listen for message changes (from useMessages)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new as ChatMessageType
        setMessages(current => {
          // Filter out temp messages with same user_id and message content
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
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const updatedMsg = payload.new as ChatMessageType
        setMessages(current => current.map(m => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        const deletedMsg = payload.old as ChatMessageType
        setMessages(current => current.filter(m => m.id !== deletedMsg.id))
      })
      // 3. Listen for chat settings changes (from useChatMaintenanceMode)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_settings' }, payload => {
        if (isDevelopment) return
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setChatMaintenanceMode(payload.new?.maintenance ?? false)
          setMotd(payload.new?.motd ?? '')
        } else if (payload.eventType === 'DELETE') {
          setChatMaintenanceMode(false)
        }
      })
      // 4. Listen for typing broadcasts (from useTypingUsers)
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
      // 5. Listen for presence changes (from useOnlineUsers)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        setOnlineCount(count)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED' && steamId) {
          // Track presence for online users
          await channel.track({
            user_id: steamId,
            username: userSummary?.personaName || 'Unknown',
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [userSummary?.steamId, userSummary?.personaName])

  return (
    <SupabaseContext.Provider
      value={{
        messages,
        setMessages,
        isBanned,
        userRoles,
        chatMaintenanceMode,
        motd,
        onlineCount,
        typingUsers,
        broadcastTyping,
        broadcastStopTyping,
        supabase: supabaseRef.current,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase(): SupabaseContextType {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}
