import { useSupabase } from '@/components/contexts/SupabaseContext'

interface OnlineUser {
  user_id: string
  username: string
}

export function useOnlineUsers(currentUser: OnlineUser): number {
  const { onlineCount } = useSupabase()
  return onlineCount
}
