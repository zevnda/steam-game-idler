import { useSupabase } from '@/components/contexts/SupabaseContext'

interface TypingUser {
  user_id: string
  username: string
}

export function useTypingUsers(currentUser: TypingUser): {
  typingUsers: TypingUser[]
  broadcastTyping: () => void
  broadcastStopTyping: () => void
} {
  const { typingUsers, broadcastTyping, broadcastStopTyping } = useSupabase()

  return { typingUsers, broadcastTyping, broadcastStopTyping }
}
