import type { UserSummary } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

import { createContext, useContext } from 'react'
import { useSupabaseStore } from '@/stores/supabaseStore'

import { useSupabaseLogic } from '@/hooks/chat/useSupabaseLogic'
import { supabase } from '@/utils/supabaseClient'

export interface MessageReaction {
  emoji: string
  user_ids: string[]
  usernames: string[]
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
  lastTyping?: number
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
  // Online users
  onlineUsers: ChatUser[]
  // Typing users
  typingUsers: ChatUser[]
  // Typing indicators
  broadcastTyping: () => void
  broadcastStopTyping: () => void
  // Fetch roles for users
  fetchRolesForUsers: (userIds: string[]) => Promise<void>
  // Supabase client
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

interface SupabaseProviderProps {
  children: ReactNode
  userSummary: UserSummary | null
}

export function SupabaseProvider({ children, userSummary }: SupabaseProviderProps): ReactNode {
  const messages = useSupabaseStore(state => state.messages)
  const setMessages = useSupabaseStore(state => state.setMessages)
  const isBanned = useSupabaseStore(state => state.isBanned)
  const userRoles = useSupabaseStore(state => state.userRoles)
  const chatMaintenanceMode = useSupabaseStore(state => state.chatMaintenanceMode)
  const onlineUsers = useSupabaseStore(state => state.onlineUsers)
  const typingUsers = useSupabaseStore(state => state.typingUsers)
  const { broadcastTyping, broadcastStopTyping, fetchRolesForUsers } = useSupabaseLogic(userSummary)

  return (
    <SupabaseContext.Provider
      value={{
        messages,
        setMessages,
        isBanned,
        userRoles,
        chatMaintenanceMode,
        onlineUsers,
        typingUsers,
        broadcastTyping,
        broadcastStopTyping,
        fetchRolesForUsers,
        supabase,
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
