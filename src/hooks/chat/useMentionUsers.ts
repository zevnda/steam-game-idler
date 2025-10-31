import type { RefObject } from 'react'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
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
      if (mentionQuery === '') {
        const { data, error } = await supabase
          .from('users')
          .select('user_id,username,avatar_url')
          .order('username', { ascending: true })
          .limit(10)
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
      setMentionResults(!error && Array.isArray(data) ? data : [])
    }
    fetchUsers()
  }, [mentionQuery])

  useEffect(() => {
    setMentionSelectedIdx(0)
  }, [mentionResults])

  const handleInputChange = (value: string, cursorPos: number): void => {
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
  }

  const handleMentionSelect = (userIdx: number, setNewMessage: (msg: string) => void): void => {
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
