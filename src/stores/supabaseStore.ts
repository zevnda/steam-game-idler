import type { ChatMessageType, ChatUser } from '@/components/contexts/SupabaseContext'

import { create } from 'zustand'

interface SupabaseStore {
  messages: ChatMessageType[]
  setMessages: (messages: ChatMessageType[] | ((prev: ChatMessageType[]) => ChatMessageType[])) => void
  isBanned: boolean
  setIsBanned: (isBanned: boolean) => void
  userRoles: { [steamId: string]: string }
  setUserRoles: (userRoles: { [steamId: string]: string }) => void
  chatMaintenanceMode: boolean
  setChatMaintenanceMode: (chatMaintenanceMode: boolean) => void
  onlineUsers: ChatUser[]
  setOnlineUsers: (onlineUsers: ChatUser[]) => void
  typingUsers: ChatUser[]
  setTypingUsers: (typingUsers: ChatUser[] | ((prev: ChatUser[]) => ChatUser[])) => void
}

export const useSupabaseStore = create<SupabaseStore>(set => ({
  messages: [],
  setMessages: value =>
    set(state => ({
      messages: typeof value === 'function' ? value(state.messages) : value,
    })),
  isBanned: false,
  setIsBanned: isBanned => set({ isBanned }),
  userRoles: {},
  setUserRoles: userRoles => set({ userRoles }),
  chatMaintenanceMode: false,
  setChatMaintenanceMode: chatMaintenanceMode => set({ chatMaintenanceMode }),
  onlineUsers: [],
  setOnlineUsers: onlineUsers => set({ onlineUsers }),
  typingUsers: [],
  setTypingUsers: value =>
    set(state => ({
      typingUsers: typeof value === 'function' ? value(state.typingUsers) : value,
    })),
}))
