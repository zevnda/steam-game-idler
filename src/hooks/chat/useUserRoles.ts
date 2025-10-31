import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

export function useUserRoles(): { userRoles: { [steamId: string]: string } } {
  const [userRoles, setUserRoles] = useState<{ [steamId: string]: string }>({})

  useEffect(() => {
    const fetchUserRoles = async (): Promise<void> => {
      const { data, error } = await supabase.from('users').select('user_id,role')
      if (!error && data) {
        const roles: { [userId: string]: string } = {}
        data.forEach((user: { user_id: string; role: string }) => {
          roles[user.user_id] = user.role
        })
        setUserRoles(roles)
      }
    }
    fetchUserRoles()
    const usersChannel = supabase
      .channel('users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, fetchUserRoles)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, fetchUserRoles)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'users' }, fetchUserRoles)
      .subscribe()
    return () => {
      supabase.removeChannel(usersChannel)
    }
  }, [])

  return { userRoles }
}
