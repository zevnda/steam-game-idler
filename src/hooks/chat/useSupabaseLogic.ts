import type { ChatMessageType, ChatUser } from '@/components/chat/SupabaseContext'
import type { UserSummary } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { useCallback, useEffect, useRef } from 'react'
import { useNavigationStore } from '@/stores/navigationStore'
import { useSupabaseStore } from '@/stores/supabaseStore'
import { useUserStore } from '@/stores/userStore'

import { supabase } from '@/utils/supabaseClient'
import { logEvent, playMentionBeep } from '@/utils/tasks'

interface PresenceData {
  user_id: string
  username: string
  avatar_url?: string
  role?: string
  presence_ref: string
}

export function useSupabaseLogic(userSummary: UserSummary | null): {
  broadcastTyping: () => void
  broadcastStopTyping: () => void
  fetchRolesForUsers: (userIds: string[]) => Promise<void>
} {
  const activePage = useNavigationStore(state => state.activePage)
  const setIsPro = useUserStore(state => state.setIsPro)
  const setMessages = useSupabaseStore(state => state.setMessages)
  const setIsBanned = useSupabaseStore(state => state.setIsBanned)
  const setUserRoles = useSupabaseStore(state => state.setUserRoles)
  const setChatMaintenanceMode = useSupabaseStore(state => state.setChatMaintenanceMode)
  const setOnlineUsers = useSupabaseStore(state => state.setOnlineUsers)
  const setTypingUsers = useSupabaseStore(state => state.setTypingUsers)
  const onlineUsers = useSupabaseStore(state => state.onlineUsers)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const renewTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const lastTypingBroadcastRef = useRef<number>(0)

  const isChatActive = activePage === 'chat'

  const broadcastStopTyping = useCallback((): void => {
    try {
      if (!userSummary?.steamId || !channelRef.current) return

      const currentUser = {
        user_id: userSummary.steamId,
        username: userSummary.personaName || 'Unknown',
      }

      if (isTypingRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'stop_typing',
          payload: currentUser,
        })

        isTypingRef.current = false
        lastTypingBroadcastRef.current = 0
      }

      // Remove self locally
      setTypingUsers(prev => prev.filter(u => u.user_id !== currentUser.user_id))

      // Clear timeouts
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (renewTypingTimeoutRef.current) clearTimeout(renewTypingTimeoutRef.current)
    } catch (error) {
      console.error('Error in broadcastStopTyping:', error)
      logEvent(`[Error] in broadcastStopTyping: ${error}`)
    }
  }, [userSummary?.steamId, userSummary?.personaName, setTypingUsers])

  const broadcastTyping = useCallback((): void => {
    try {
      if (!userSummary?.steamId || !channelRef.current) return

      const currentUser = {
        user_id: userSummary.steamId,
        username: userSummary.personaName || 'Unknown',
      }

      const now = Date.now()
      const timeSinceLastBroadcast = now - lastTypingBroadcastRef.current

      // Only broadcast if we haven't broadcasted recently (first keystroke or renewal)
      if (!isTypingRef.current || timeSinceLastBroadcast >= 10000) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: currentUser,
        })

        lastTypingBroadcastRef.current = now
        isTypingRef.current = true

        // Add self locally
        setTypingUsers(prev => {
          const exists = prev.some(u => u.user_id === currentUser.user_id)
          if (!exists) {
            return [...prev, currentUser]
          }
          return prev
        })
      }

      // Clear previous timeouts
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (renewTypingTimeoutRef.current) clearTimeout(renewTypingTimeoutRef.current)

      // Renew typing indicator after 5 seconds if still typing
      renewTypingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          // User is still typing after 5s, renew the indicator
          channelRef.current?.send({
            type: 'broadcast',
            event: 'typing',
            payload: currentUser,
          })
          lastTypingBroadcastRef.current = Date.now()
        }
      }, 10000)

      // Stop typing after 3s of inactivity (for auto-clear if user stops without sending)
      typingTimeoutRef.current = setTimeout(() => {
        broadcastStopTyping()
      }, 10000)
    } catch (error) {
      console.error('Error in broadcastTyping:', error)
      logEvent(`[Error] in broadcastTyping: ${error}`)
    }
  }, [userSummary?.steamId, userSummary?.personaName, setTypingUsers, broadcastStopTyping])

  // Update or insert user in 'users' table on app load
  useEffect(() => {
    const steamId = userSummary?.steamId
    const personaName = userSummary?.personaName

    if (!steamId || !personaName) return

    const updateUserStore = async (): Promise<void> => {
      try {
        // First, check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', steamId)
          .maybeSingle()

        if (existingUser) {
          // User exists - UPDATE only username and avatar_url
          const { error } = await supabase
            .from('users')
            .update({
              username: personaName,
              avatar_url: userSummary?.avatar || null,
            })
            .eq('user_id', steamId)

          if (error) {
            console.error('Error updating user:', error)
            logEvent(`[Error] in updateUserStore: ${error.message}`)
          }
        } else {
          // User doesn't exist - INSERT with defaults
          const { error } = await supabase.from('users').insert({
            user_id: steamId,
            username: personaName,
            avatar_url: userSummary?.avatar || null,
            role: 'user',
          })

          if (error) {
            console.error('Error inserting new user:', error)
            logEvent(`[Error] in insertUser: ${error.message}`)
          }
        }
      } catch (err) {
        console.error('Error in updateUserStore:', err)
        logEvent(`[Error] in updateUserStore: ${err}`)
      }
    }
    updateUserStore()
  }, [userSummary?.steamId, userSummary?.personaName, userSummary?.avatar])

  // Check for active subscription and set isPro
  useEffect(() => {
    const steamId = userSummary?.steamId

    if (!steamId) return

    const checkSubscription = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('steam_id', steamId)
          .in('status', ['active', 'trialing', 'past_due'])
          .maybeSingle()

        if (error) {
          console.error('Error checking subscription:', error)
          logEvent(`[Error] in checkSubscription: ${error.message}`)
          setIsPro(false)
          return
        }

        setIsPro(!!data)
      } catch (error) {
        console.error('Error checking subscription:', error)
        logEvent(`[Error] in checkSubscription: ${error}`)
        setIsPro(false)
      }
    }

    checkSubscription()
  }, [userSummary?.steamId, setIsPro])

  // Check if current user is banned
  useEffect(() => {
    const checkBanned = async () => {
      if (!isChatActive) return

      const steamId = userSummary?.steamId

      if (!steamId) return

      try {
        const { data, error } = await supabase.from('users').select('role').eq('user_id', steamId).maybeSingle()

        if (error) {
          console.error('Error checking banned status:', error)
          logEvent(`[Error] in checkBanned: ${error.message}`)
          setIsBanned(false)
          return
        }

        setIsBanned(data?.role === 'banned')
      } catch (error) {
        console.error('Error checking banned:', error)
        logEvent(`[Error] in checkBanned: ${error}`)
        setIsBanned(false)
      }
    }

    checkBanned()
  }, [userSummary?.steamId, onlineUsers, setIsBanned, isChatActive])

  const fetchRolesForUsers = useCallback(
    async (userIds: string[]): Promise<void> => {
      if (userIds.length === 0) return

      try {
        const { data, error } = await supabase.from('users').select('user_id, role').in('user_id', userIds)

        if (error) {
          console.error('Error fetching roles:', error)
          logEvent(`[Error] in fetchRolesForUsers: ${error.message}`)
          return
        }

        const rolesMap = data.reduce(
          (acc, user) => {
            acc[user.user_id] = user.role || 'user'
            return acc
          },
          {} as { [userId: string]: string },
        )

        setUserRoles(prev => ({ ...prev, ...rolesMap }))
      } catch (error) {
        console.error('Error in fetchRolesForUsers:', error)
        logEvent(`[Error] in fetchRolesForUsers: ${error}`)
      }
    },
    [setUserRoles],
  )

  // Cleanup typing indicator when chat becomes inactive or component unmounts
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        broadcastStopTyping()
      }
    }
  }, [isChatActive, broadcastStopTyping])

  // Auto-cleanup stale typing indicators
  useEffect(() => {
    if (!isChatActive) return

    const cleanupInterval = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now()
        // Filter out typing users whose last broadcast was more than 15 seconds ago
        return prev.filter(user => {
          // Keep current user's typing indicator
          if (user.user_id === userSummary?.steamId) return true

          // Remove others if they haven't renewed in 15 seconds
          // This is a safeguard for when stop_typing broadcasts fail
          const lastTyping = user.lastTyping || now
          return now - lastTyping < 15000
        })
      })
    }, 5000) // Check every 5 seconds

    return () => clearInterval(cleanupInterval)
  }, [isChatActive, userSummary?.steamId, setTypingUsers])

  // Presence channel for online users (always active when user is logged in)
  useEffect(() => {
    if (!userSummary?.steamId) return

    const presenceChannel = supabase.channel('online-presence')

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState() as Record<string, PresenceData[]>
        const onlineUsersMap = new Map<string, ChatUser>()
        Object.values(state).forEach(presences => {
          presences.forEach(presence => {
            // Deduplicate by user_id, keeping the latest presence data
            onlineUsersMap.set(presence.user_id, {
              user_id: presence.user_id,
              username: presence.username,
              avatar_url: presence.avatar_url,
            })
          })
        })
        setOnlineUsers(Array.from(onlineUsersMap.values()))
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          presenceChannel.track({
            user_id: userSummary.steamId,
            username: userSummary.personaName || 'Unknown',
            avatar_url: userSummary.avatar,
          })
        }
      })

    return () => {
      presenceChannel.unsubscribe()
      supabase.removeChannel(presenceChannel)
    }
  }, [userSummary?.steamId, userSummary?.personaName, userSummary?.avatar, setOnlineUsers])

  useEffect(() => {
    // Only run if chat is active
    if (!isChatActive) {
      // If chat becomes inactive and user was typing, stop typing
      if (isTypingRef.current) {
        broadcastStopTyping()
      }
      return
    }

    const steamId = userSummary?.steamId

    // Skip in development for maintenance mode
    const isDevelopment = process.env.NODE_ENV === 'development'
    // const isDevelopment = false

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

    fetchMaintenanceMode()

    // Create channel for chat features (messages, typing, settings)
    const channel = supabase.channel('chat-channel')

    channelRef.current = channel

    channel
      // 1. Listen for message changes (from useMessages)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
        try {
          const newMsg = payload.new as ChatMessageType
          let replyToMsg: ChatMessageType | null = null

          // If the message has a reply_to_id, fetch the full reply data
          if (newMsg.reply_to_id) {
            try {
              const { data, error: replyError } = await supabase
                .from('messages')
                .select('*')
                .eq('id', newMsg.reply_to_id)
                .single()

              if (!replyError && data) {
                replyToMsg = data as ChatMessageType
                newMsg.reply_to = replyToMsg
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
          // 1. Always for admin user
          if (userSummary?.steamId === '76561198158912649' && newMsg.user_id !== userSummary.steamId) {
            playMentionBeep()
            return
          }
          // 2. The new message mentions the current user by username
          if (userSummary?.personaName && newMsg.message.includes(`@${userSummary.personaName}`)) {
            playMentionBeep()
            return
          }
          // 3. The new message is a reply to one of the current user's messages
          // Reuse replyToMsg instead of fetching again
          if (replyToMsg && replyToMsg.user_id === steamId) {
            playMentionBeep()
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
      // 2. Listen for chat settings changes (from useChatMaintenanceMode)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_settings' }, payload => {
        try {
          if (isDevelopment) return
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setChatMaintenanceMode(payload.new?.maintenance ?? false)
          } else if (payload.eventType === 'DELETE') {
            setChatMaintenanceMode(false)
          }
        } catch (error) {
          console.error('Error handling chat_settings change:', error)
          logEvent(`[Error] in chat_settings handler: ${error}`)
        }
      })
      // 3. Listen for typing broadcasts (from useTypingUsers)
      .on('broadcast', { event: 'typing' }, payload => {
        try {
          setTypingUsers(prev => {
            const exists = prev.some(u => u.user_id === payload.payload.user_id)
            if (exists) {
              // Update timestamp for existing user
              return prev.map(u => (u.user_id === payload.payload.user_id ? { ...u, lastTyping: Date.now() } : u))
            }
            // Add new typing user with timestamp
            return [...prev, { ...payload.payload, lastTyping: Date.now() }]
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
      .subscribe()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      // Clean up typing indicator when channel is removed
      if (isTypingRef.current) {
        broadcastStopTyping()
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (renewTypingTimeoutRef.current) {
        clearTimeout(renewTypingTimeoutRef.current)
      }
      supabase.removeChannel(channel)
      // Reset store on cleanup
      setMessages([])
      setUserRoles({})
      setTypingUsers([])
    }
  }, [
    userSummary?.steamId,
    userSummary?.personaName,
    userSummary?.avatar,
    isChatActive,
    broadcastStopTyping,
    setMessages,
    setChatMaintenanceMode,
    setTypingUsers,
    setIsBanned,
    setUserRoles,
  ])

  useEffect(() => {
    if (!isChatActive) {
      setMessages([])
      setUserRoles({})
      setTypingUsers([])
    }
  }, [isChatActive, setMessages, setUserRoles, setTypingUsers])

  return { broadcastTyping, broadcastStopTyping, fetchRolesForUsers }
}
