import type { UserSummary } from '@/types'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { logEvent, playMentionBeep } from '@/utils/tasks'

export interface MessageReaction {
  emoji: string
  user_ids: string[]
  count: number
}

export interface ChatMessageType {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  avatar_url?: string
  reply_to_id?: string | null
  reply_to?: ChatMessageType | null
  reactions?: MessageReaction[]
}

export interface ChatUser {
  created_at?: string
  id?: number
  user_id?: string
  role?: string
  username: string
  avatar_url?: string
  is_banned?: boolean
}

interface PresenceState {
  user_id?: string
  username?: string
  online_at?: string
  presence_ref: string
}

interface SupabaseContextType {
  // All users
  allUsers: ChatUser[]
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
  // Online users
  onlineUsers: ChatUser[]
  // Typing users
  typingUsers: ChatUser[]
  // Typing indicators
  broadcastTyping: () => void
  broadcastStopTyping: () => void
  // Supabase client
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

interface SupabaseProviderProps {
  children: ReactNode
  userSummary: UserSummary | null
}

export function SupabaseProvider({ children, userSummary }: SupabaseProviderProps): ReactNode {
  const { activePage } = useNavigationContext()
  const isChatActive = activePage === 'chat'

  const [allUsers, setAllUsers] = useState<ChatUser[]>([])
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isBanned, setIsBanned] = useState(false)
  const [userRoles, setUserRoles] = useState<{ [steamId: string]: string }>({})
  const [chatMaintenanceMode, setChatMaintenanceMode] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const [typingUsers, setTypingUsers] = useState<ChatUser[]>([])
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
    try {
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
    } catch (error) {
      console.error('Error in broadcastTyping:', error)
      logEvent(`[Error] in broadcastTyping: ${error}`)
    }
  }

  const broadcastStopTyping = (): void => {
    try {
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
    } catch (error) {
      console.error('Error in broadcastStopTyping:', error)
      logEvent(`[Error] in broadcastStopTyping: ${error}`)
    }
  }

  // Ensure current user exists in Supabase 'users' table; create if missing
  useEffect(() => {
    const supabase = supabaseRef.current

    const ensureUserExists = async (): Promise<void> => {
      try {
        if (!userSummary?.steamId) return

        const { data, error } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', userSummary.steamId)
          .maybeSingle()

        if (error) {
          console.error('Error checking user existence:', error)
          logEvent(`[Error] in ensureUserExists (select): ${error.message || error}`)
        }

        if (!data) {
          const insertPayload = {
            user_id: userSummary.steamId,
            username: userSummary.personaName || 'Unknown',
            avatar_url: userSummary.avatar || null,
            role: 'user',
            is_banned: false,
          }
          const { error: insertError } = await supabase.from('users').insert([insertPayload])
          if (insertError) {
            console.error('Error inserting new user:', insertError)
            logEvent(`[Error] in ensureUserExists (insert): ${insertError.message || insertError}`)
          }
        }
      } catch (err) {
        console.error('Error in ensureUserExists:', err)
        logEvent(`[Error] in ensureUserExists: ${err}`)
      }
    }

    ensureUserExists()
  }, [userSummary?.steamId, userSummary?.personaName, userSummary?.avatar])

  useEffect(() => {
    // Only run if chat is active
    if (!isChatActive) return

    const supabase = supabaseRef.current
    const steamId = userSummary?.steamId

    // Skip in development for maintenance mode
    const isDevelopment = process.env.NODE_ENV === 'development'
    // const isDevelopment = false

    // Fetch all users
    const fetchAllUsers = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.from('users').select('user_id,username,avatar_url,role')
        if (error) {
          console.error('Error fetching all users:', error)
          logEvent(`[Error] in fetchAllUsers: ${error.message}`)
          return
        }
        if (data) {
          setAllUsers(data as ChatUser[])
        }
      } catch (error) {
        console.error('Error in fetchAllUsers:', error)
        logEvent(`[Error] in fetchAllUsers: ${error}`)
      }
    }

    // Fetch initial user roles
    const fetchUserRoles = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.from('users').select('user_id,role,is_banned')
        if (error) {
          console.error('Error fetching user roles:', error)
          logEvent(`[Error] in fetchUserRoles: ${error.message}`)
          return
        }
        if (data) {
          const roles: { [userId: string]: string } = {}
          data.forEach((user: { user_id: string; role: string; is_banned?: boolean }) => {
            roles[user.user_id] = user.role
          })
          setUserRoles(roles)
        }
      } catch (error) {
        console.error('Error in fetchUserRoles:', error)
        logEvent(`[Error] in fetchUserRoles: ${error}`)
      }
    }

    // Fetch initial banned status
    const fetchBannedStatus = async (): Promise<void> => {
      try {
        if (!steamId) return
        const { data, error } = await supabase.from('users').select('is_banned').eq('user_id', steamId).single()
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching banned status:', error)
          logEvent(`[Error] in fetchBannedStatus: ${error.message}`)
        }
        if (!error && data?.is_banned === true) setIsBanned(true)
        else setIsBanned(false)
      } catch (error) {
        console.error('Error in fetchBannedStatus:', error)
        logEvent(`[Error] in fetchBannedStatus: ${error}`)
      }
    }

    // Fetch initial maintenance mode
    const fetchMaintenanceMode = async (): Promise<void> => {
      try {
        if (isDevelopment) return
        const { data, error } = await supabase.from('chat_settings').select('maintenance').maybeSingle()
        if (error) {
          console.error('Error fetching maintenance mode:', error)
          logEvent(`[Error] in fetchMaintenanceMode: ${error.message}`)
          return
        }
        if (typeof data?.maintenance === 'boolean') {
          setChatMaintenanceMode(data.maintenance)
        }
      } catch (error) {
        console.error('Error in fetchMaintenanceMode:', error)
        logEvent(`[Error] in fetchMaintenanceMode: ${error}`)
      }
    }

    // Fetch initial MOTD
    const fetchMotd = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.from('chat_settings').select('motd').maybeSingle()
        if (error) {
          console.error('Error fetching MOTD:', error)
          logEvent(`[Error] in fetchMotd: ${error.message}`)
          return
        }
        if (typeof data?.motd === 'string') {
          setMotd(data.motd)
        }
      } catch (error) {
        console.error('Error in fetchMotd:', error)
        logEvent(`[Error] in fetchMotd: ${error}`)
      }
    }

    fetchAllUsers()
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
        fetchAllUsers()
        fetchUserRoles()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, payload => {
        fetchAllUsers()
        fetchUserRoles()
        // Also check if current user's ban status changed (from useMessages)
        if (payload.new?.user_id === steamId) {
          setIsBanned(payload.new?.is_banned === true)
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'users' }, () => {
        fetchAllUsers()
        fetchUserRoles()
      })
      // 2. Listen for message changes (from useMessages)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
        try {
          const newMsg = payload.new as ChatMessageType

          // If the message has a reply_to_id, fetch the full reply data
          if (newMsg.reply_to_id) {
            try {
              const { data: replyToMsg, error: replyError } = await supabase
                .from('messages')
                .select('*')
                .eq('id', newMsg.reply_to_id)
                .single()

              if (!replyError && replyToMsg) {
                newMsg.reply_to = replyToMsg as ChatMessageType
              }
            } catch (error) {
              console.error('Error fetching reply data for new message:', error)
              logEvent(`[Error] in fetching reply data: ${error}`)
            }
          }

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

          // Play mention beep if:
          // 1. The new message mentions the current user by username
          if (userSummary?.personaName && newMsg.message.includes(`@${userSummary.personaName}`)) {
            playMentionBeep()
            return
          }

          // 2. The new message is a reply to one of the current user's messages
          if (newMsg.reply_to_id && steamId) {
            try {
              const { data: repliedToMessage, error } = await supabase
                .from('messages')
                .select('user_id')
                .eq('id', newMsg.reply_to_id)
                .single()

              if (!error && repliedToMessage?.user_id === steamId) {
                playMentionBeep()
              }
            } catch (error) {
              console.error('Error checking reply notification:', error)
              logEvent(`[Error] in reply notification check: ${error}`)
            }
          }
        } catch (error) {
          console.error('Error handling INSERT message:', error)
          logEvent(`[Error] in message INSERT handler: ${error}`)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        try {
          const updatedMsg = payload.new as ChatMessageType
          setMessages(current => current.map(m => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)))
        } catch (error) {
          console.error('Error handling UPDATE message:', error)
          logEvent(`[Error] in message UPDATE handler: ${error}`)
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        try {
          const deletedMsg = payload.old as ChatMessageType
          setMessages(current => current.filter(m => m.id !== deletedMsg.id))
        } catch (error) {
          console.error('Error handling DELETE message:', error)
          logEvent(`[Error] in message DELETE handler: ${error}`)
        }
      })
      // 3. Listen for chat settings changes (from useChatMaintenanceMode)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_settings' }, payload => {
        try {
          if (isDevelopment) return
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setChatMaintenanceMode(payload.new?.maintenance ?? false)
            setMotd(payload.new?.motd ?? '')
          } else if (payload.eventType === 'DELETE') {
            setChatMaintenanceMode(false)
          }
        } catch (error) {
          console.error('Error handling chat_settings change:', error)
          logEvent(`[Error] in chat_settings handler: ${error}`)
        }
      })
      // 4. Listen for typing broadcasts (from useTypingUsers)
      .on('broadcast', { event: 'typing' }, payload => {
        try {
          setTypingUsers(prev => {
            const exists = prev.some(u => u.user_id === payload.payload.user_id)
            if (!exists) {
              return [...prev, payload.payload]
            }
            return prev
          })
        } catch (error) {
          console.error('Error handling typing broadcast:', error)
          logEvent(`[Error] in typing broadcast handler: ${error}`)
        }
      })
      .on('broadcast', { event: 'stop_typing' }, payload => {
        try {
          setTypingUsers(prev => prev.filter(u => u.user_id !== payload.payload.user_id))
        } catch (error) {
          console.error('Error handling stop_typing broadcast:', error)
          logEvent(`[Error] in stop_typing broadcast handler: ${error}`)
        }
      })
      // 5. Listen for presence changes (from useOnlineUsers)
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = channel.presenceState()
          setOnlineCount(Object.keys(state).length)

          // Extract online users from presence state (deduplicated by user_id)
          const onlineMap = new Map<string, ChatUser>()
          Object.values(state).forEach((presences: unknown) => {
            const presenceArray = presences as PresenceState[]
            presenceArray.forEach((presence: PresenceState) => {
              if (presence.user_id && presence.username) {
                onlineMap.set(presence.user_id, {
                  user_id: presence.user_id,
                  username: presence.username,
                })
              }
            })
          })
          setOnlineUsers(Array.from(onlineMap.values()))
        } catch (error) {
          console.error('Error handling presence sync:', error)
          logEvent(`[Error] in presence sync handler: ${error}`)
        }
      })
      .subscribe(async status => {
        try {
          if (status === 'SUBSCRIBED' && steamId) {
            // Track presence for online users
            await channel.track({
              user_id: steamId,
              username: userSummary?.personaName || 'Unknown',
              online_at: new Date().toISOString(),
            })
          }
        } catch (error) {
          console.error('Error in channel subscription:', error)
          logEvent(`[Error] in channel subscription: ${error}`)
        }
      })

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [userSummary?.steamId, userSummary?.personaName, isChatActive])

  return (
    <SupabaseContext.Provider
      value={{
        allUsers,
        messages,
        setMessages,
        isBanned,
        userRoles,
        chatMaintenanceMode,
        motd,
        onlineCount,
        onlineUsers,
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
