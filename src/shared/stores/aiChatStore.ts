import { create } from 'zustand'

export interface AiChatSource {
  title: string
  url: string
}

export interface AiChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AiChatSource[]
}

export interface AiChatQuota {
  used: number
  max: number
}

interface AiChatStore {
  isOpen: boolean
  messages: AiChatMessage[]
  isSending: boolean
  quota: AiChatQuota | null
  open: () => void
  close: () => void
  addMessage: (message: AiChatMessage) => void
  setSending: (isSending: boolean) => void
  setQuota: (quota: AiChatQuota) => void
}

// Session-only AI Assistant panel state - deliberately not persisted (cleared on app restart) and
// not keyed by AccountKey like idlingStore/sessionStore: this is a stateless Q&A helper over
// static docs/UI content, not per-Steam-account automation state, so a single global conversation
// is the right shape rather than one per signed-in account.
export const useAiChatStore = create<AiChatStore>(set => ({
  isOpen: false,
  messages: [],
  isSending: false,
  quota: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  addMessage: message => set(state => ({ messages: [...state.messages, message] })),
  setSending: isSending => set({ isSending }),
  setQuota: quota => set({ quota }),
}))
