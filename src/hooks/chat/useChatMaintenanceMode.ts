import { useSupabase } from '@/components/contexts/SupabaseContext'

export function useChatMaintenanceMode(): boolean {
  const { chatMaintenanceMode } = useSupabase()
  return chatMaintenanceMode
}
