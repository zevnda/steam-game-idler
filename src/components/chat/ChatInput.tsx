import type { ChangeEvent, ReactElement, RefObject } from 'react'

import { Button, cn, Textarea } from '@heroui/react'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { IoSend } from 'react-icons/io5'

import ExtLink from '@/components/ui/ExtLink'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

interface ChatInputProps {
  inputRef: RefObject<HTMLTextAreaElement>
  onSendMessage: (msg: string) => void
  handleEditLastMessage: () => void
}

export default function ChatInput({ inputRef, onSendMessage, handleEditLastMessage }: ChatInputProps): ReactElement {
  const [newMessage, setNewMessage] = useState('')
  const [mentionQuery, setMentionQuery] = useState<string>('')
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [mentionResults, setMentionResults] = useState<
    Array<{ user_id: string; username: string; avatar_url?: string }>
  >([])
  const [mentionSelectedIdx, setMentionSelectedIdx] = useState<number>(0)
  const { t } = useTranslation()

  // Fetch matching users from Supabase when mentionQuery changes
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      if (mentionQuery === '') {
        // Just '@' typed: fetch 10 users alphabetically
        const { data, error } = await supabase
          .from('users')
          .select('user_id,username,avatar_url')
          .order('username', { ascending: true })
          .limit(10)
        if (!error && Array.isArray(data)) {
          setMentionResults(data)
        } else {
          setMentionResults([])
        }
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
      if (!error && Array.isArray(data)) {
        setMentionResults(data)
      } else {
        setMentionResults([])
      }
    }
    fetchUsers()
  }, [mentionQuery])

  // Reset selected index when mention results change
  useEffect(() => {
    setMentionSelectedIdx(0)
  }, [mentionResults])

  // Detect @mention in input and track query
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const value = e.target.value
    setNewMessage(value)

    // Find last @mention in the text before cursor
    const cursorPos = (e.target as HTMLTextAreaElement).selectionStart || value.length
    const textBeforeCursor = value.slice(0, cursorPos)
    // Changed regex to allow usernames starting with '-' and other non-whitespace chars
    const mentionMatch = /@([^\s@]*)$/.exec(textBeforeCursor)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setMentionStart(cursorPos - mentionMatch[0].length)
    } else {
      setMentionQuery('')
      setMentionStart(null)
    }
  }

  const handleMentionSelect = (userIdx: number): void => {
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

  return (
    <div className='p-2 pt-0'>
      <p className='text-[10px] py-1'>
        GitHub Flavored Markdown is supported.{' '}
        <ExtLink
          className='text-dynamic hover:text-dynamic-hover duration-150'
          href='https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax'
        >
          Learn more
        </ExtLink>
      </p>

      <form
        onSubmit={e => {
          e.preventDefault()
          if (newMessage.trim()) {
            onSendMessage(newMessage)
            setNewMessage('')
            setMentionQuery('')
            setMentionStart(null)
          }
        }}
      >
        <div style={{ position: 'relative' }}>
          <Textarea
            ref={inputRef}
            size='sm'
            placeholder={t('chat.inputPlaceholder')}
            className='w-full mb-0 pb-0 resize-y'
            classNames={{
              inputWrapper: cn(
                'bg-input data-[hover=true]:!bg-inputhover rounded-md',
                'group-data-[focus-within=true]:!bg-inputhover',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
              ),
              input: ['!min-h-8 !text-content text-xs placeholder:text-xs placeholder:text-altwhite/50 pt-2'],
            }}
            endContent={
              <Button
                size='sm'
                isIconOnly
                isDisabled={!newMessage.trim()}
                startContent={<IoSend size={16} />}
                type='submit'
                className={cn(
                  'bg-transparent hover:bg-white/10 hover:text-dynamic/80 transition-colors',
                  newMessage.trim() ? 'text-dynamic' : 'text-white/10',
                )}
              />
            }
            minRows={1}
            maxRows={15}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={e => {
              // Mention navigation
              if (mentionResults.length > 0 && mentionStart !== null) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setMentionSelectedIdx(idx => Math.min(idx + 1, mentionResults.length - 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setMentionSelectedIdx(idx => Math.max(idx - 1, 0))
                  return
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleMentionSelect(mentionSelectedIdx)
                  return
                }
                if (e.key === 'Tab') {
                  e.preventDefault()
                  handleMentionSelect(mentionSelectedIdx)
                  return
                }
                // Allow typing and other keys
              }
              if (e.key === 'ArrowUp' && !newMessage) {
                e.preventDefault()
                handleEditLastMessage()
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (newMessage.trim()) {
                  onSendMessage(newMessage)
                  setNewMessage('')
                  setMentionQuery('')
                  setMentionStart(null)
                }
              }
              // SHIFT+ENTER is default (new line)
            }}
            autoFocus
          />
          {/* Floating mention preview */}
          {mentionResults.length > 0 && mentionStart !== null && (
            <div className='absolute left-0 bottom-[110%] bg-input rounded-lg z-50 w-full'>
              <p className='text-[10px] font-semibold border-b border-border p-2 uppercase'>Users</p>

              {mentionResults.map((user, idx) => (
                <div
                  key={user.user_id}
                  className={cn(
                    'flex justify-between items-center cursor-pointer p-2 hover:bg-white/5 text-xs',
                    idx === mentionSelectedIdx ? 'bg-white/10' : '',
                  )}
                  onClick={() => handleMentionSelect(idx)}
                  tabIndex={-1}
                  aria-selected={idx === mentionSelectedIdx}
                >
                  <div className='flex items-center'>
                    <Image
                      src={
                        user.avatar_url ||
                        `https://ui-avatars.com/api/?name=${user.username}&background=5865f2&color=fff`
                      }
                      alt={`Avatar of ${user.username}`}
                      className='w-6 h-6 rounded-full mr-2'
                      width={24}
                      height={24}
                    />
                    <span>@{user.username}</span>
                  </div>
                  <span className='text-[10px] text-altwhite'>{user.user_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
