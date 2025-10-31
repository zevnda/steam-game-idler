import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

export function useOnlineUsers(): number {
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    const fetchOnlineUsers = async (): Promise<void> => {
      const since = new Date(Date.now() - 60 * 1000).toISOString()
      const { data, error } = await supabase.from('users').select('user_id').gte('last_active', since)
      if (!error && Array.isArray(data)) {
        setOnlineCount(data.length)
      }
    }
    fetchOnlineUsers()
    const interval = setInterval(fetchOnlineUsers, 10000)
    return () => clearInterval(interval)
  }, [])

  return onlineCount
}
