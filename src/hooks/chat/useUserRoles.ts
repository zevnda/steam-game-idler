import { useSupabase } from '@/components/contexts/SupabaseContext'

export function useUserRoles(): { userRoles: { [steamId: string]: string } } {
  const { userRoles } = useSupabase()
  return { userRoles }
}
