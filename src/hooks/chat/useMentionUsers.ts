import type { RefObject } from 'react'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

import { logEvent } from '@/utils/tasks'

const supabase = createClient(
  'https://zirhwhmtmhindenkzsoh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcmh3aG10bWhpbmRlbmt6c29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTQ4NDYsImV4cCI6MjA3NzczMDg0Nn0.x2VF88-3oA3OsrK5WGR7hdlonCovQqCAB5d4w7j8f1k',
)

export interface MentionUser {
  user_id: string
  username: string
  avatar_url?: string
}

export function useMentionUsers(
  inputRef: RefObject<HTMLTextAreaElement>,
  newMessage: string,
): {
  mentionQuery: string
  mentionStart: number | null
  mentionResults: MentionUser[]
  mentionSelectedIdx: number
  setMentionSelectedIdx: (idx: number) => void
  handleInputChange: (value: string, cursorPos: number) => void
  handleMentionSelect: (userIdx: number, setNewMessage: (msg: string) => void) => void
  setMentionQuery: (query: string) => void
  setMentionStart: (start: number | null) => void
  setMentionResults: (results: MentionUser[]) => void
} {
  const [mentionQuery, setMentionQuery] = useState<string>('')
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([])
  const [mentionSelectedIdx, setMentionSelectedIdx] = useState<number>(0)

  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      try {
        if (mentionQuery === '') {
          const { data, error } = await supabase
            .from('users')
            .select('user_id,username,avatar_url')
            .order('username', { ascending: true })
            .limit(10)
          if (error) {
            console.error('Error fetching users:', error)
            logEvent(`[Error] in fetchUsers (mention): ${error.message}`)
          }
          setMentionResults(!error && Array.isArray(data) ? data : [])
          return
        }
        if (!mentionQuery || mentionQuery.length < 1) {
          setMentionResults([])
          return
        }
        const { data, error } = await supabase
          .from('users')
          .select('user_id,username,avatar_url')
          .ilike('username', `${mentionQuery}%`)
          .limit(5)
        if (error) {
          console.error('Error searching users:', error)
          logEvent(`[Error] in searchUsers (mention): ${error.message}`)
        }
        setMentionResults(!error && Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error in fetchUsers:', error)
        logEvent(`[Error] in fetchUsers: ${error}`)
        setMentionResults([])
      }
    }
    fetchUsers()
  }, [mentionQuery])

  useEffect(() => {
    setMentionSelectedIdx(0)
  }, [mentionResults])

  const handleInputChange = (value: string, cursorPos: number): void => {
    try {
      // Find last @mention in the text before cursor
      const textBeforeCursor = value.slice(0, cursorPos)
      const mentionMatch = /@([^\s@]*)$/.exec(textBeforeCursor)
      if (mentionMatch) {
        setMentionQuery(mentionMatch[1])
        setMentionStart(cursorPos - mentionMatch[0].length)
      } else {
        setMentionQuery('')
        setMentionStart(null)
      }
    } catch (error) {
      console.error('Error in handleInputChange:', error)
      logEvent(`[Error] in handleInputChange (mention): ${error}`)
    }
  }

  const handleMentionSelect = (userIdx: number, setNewMessage: (msg: string) => void): void => {
    try {
      const user = mentionResults[userIdx]
      if (mentionStart !== null && inputRef.current && user) {
        const before = newMessage.slice(0, mentionStart)
        const after = newMessage.slice(inputRef.current.selectionStart)
        const mentionText = `@${user.username} `
        const updated = before + mentionText + after
        setNewMessage(updated)
        setMentionQuery('')
        setMentionStart(null)
        setMentionResults([])
        setTimeout(() => {
          inputRef.current!.focus()
          inputRef.current!.setSelectionRange((before + mentionText).length, (before + mentionText).length)
        }, 0)
      }
    } catch (error) {
      console.error('Error in handleMentionSelect:', error)
      logEvent(`[Error] in handleMentionSelect: ${error}`)
    }
  }

  return {
    mentionQuery,
    mentionStart,
    mentionResults,
    mentionSelectedIdx,
    setMentionSelectedIdx,
    handleInputChange,
    handleMentionSelect,
    setMentionQuery,
    setMentionStart,
    setMentionResults,
  }
}
