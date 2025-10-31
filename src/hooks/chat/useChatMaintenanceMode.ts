import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

export function useChatMaintenanceMode(): boolean {
  const [chatMaintenanceMode, setChatMaintenanceMode] = useState<boolean>(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return
    const fetchMaintenanceMode = async (): Promise<void> => {
      const { data, error } = await supabase.from('chat_settings').select('maintenance').maybeSingle()
      if (!error && typeof data?.maintenance === 'boolean') {
        setChatMaintenanceMode(data.maintenance)
      }
    }
    fetchMaintenanceMode()
    const chatSettings = supabase
      .channel('chat_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_settings' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setChatMaintenanceMode(payload.new?.maintenance ?? false)
        } else if (payload.eventType === 'DELETE') {
          setChatMaintenanceMode(false)
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(chatSettings)
    }
  }, [])

  return chatMaintenanceMode
}
