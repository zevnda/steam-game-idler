import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

export function useMotd(): string {
  const [motd, setMotd] = useState<string>('')

  useEffect(() => {
    const fetchMotd = async (): Promise<void> => {
      const { data, error } = await supabase.from('chat_settings').select('motd').maybeSingle()
      if (!error && data?.motd) setMotd(data.motd)
    }
    fetchMotd()
  }, [])

  return motd
}
