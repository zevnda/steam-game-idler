import type { UserSummary } from '@/types'
import type { AnchorHTMLAttributes, MouseEvent, ReactElement } from 'react'

import { open } from '@tauri-apps/plugin-shell'

import { cn } from '@heroui/react'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import { useStateContext } from '@/components/contexts/StateContext'

interface ChatMessageContentProps {
  message: string
  userSummary: UserSummary
  isAdmin?: boolean
  isPinned?: boolean
  onPin?: (message: string) => void
  onUnpin?: () => void
}

function MarkdownLink(props: AnchorHTMLAttributes<HTMLAnchorElement>): ReactElement {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault()
    open(props.href || '')
  }
  return (
    <a {...props} onClick={handleClick}>
      {props.children}
    </a>
  )
}

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

const preprocessMessage = (text: string, validMentions: string[]): string => {
  let processed = text
  if (validMentions && validMentions.length > 0) {
    validMentions.forEach(username => {
      // Updated regex: allow any username, including hyphens and numbers
      // Escape username for regex safety
      const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(@${escapedUsername})(?![\\w-])`, 'gi')
      // eslint-disable-next-line quotes
      processed = processed.replace(regex, `<span class='mention-highlight'>$1</span>`)
    })
  }
  return processed
}

const FIXED_IMG_SIZE = 200

export default function ChatMessageContent({ message, userSummary }: ChatMessageContentProps): ReactElement {
  const [modalImg, setModalImg] = useState<string | null>(null)
  const { sidebarCollapsed, transitionDuration } = useStateContext()
  const [validMentions, setValidMentions] = useState<string[]>([])

  // Extract all @username patterns from the message and check Supabase
  useEffect(() => {
    // Updated regex: match @ followed by any sequence of non-whitespace, non-punctuation characters
    const mentionRegex = /@([^\s.,!?;:]+)/g
    const found = Array.from(message.matchAll(mentionRegex)).map(m => m[1])
    if (found.length === 0) {
      setValidMentions([])
      return
    }
    // Query Supabase for these usernames
    const fetchMentions = async (): Promise<void> => {
      const { data, error } = await supabase.from('users').select('username').in('username', found)
      if (!error && Array.isArray(data)) {
        setValidMentions(data.map(u => u.username))
      } else {
        setValidMentions([])
      }
    }
    fetchMentions()
  }, [message])

  // Custom image renderer for markdown
  const MarkdownImage = (props: React.ImgHTMLAttributes<HTMLImageElement>): ReactElement => {
    return (
      <>
        <Image
          src={typeof props.src === 'string' ? props.src : ''}
          alt={props.alt || 'image'}
          width={FIXED_IMG_SIZE}
          height={FIXED_IMG_SIZE}
          className='max-w-[200px] h-[200px] object-cover cursor-pointer rounded-lg my-2'
          onClick={() => {
            if (typeof props.src === 'string') setModalImg(props.src)
          }}
        />

        {modalImg === props.src && (
          <div
            className={cn(
              'fixed top-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-[9999]',
              'flex flex-col h-screen ease-in-out',
              sidebarCollapsed ? 'w-[calc(100vw-56px)] left-[56px]' : 'w-[calc(100vw-250px)] left-[250px]',
            )}
            style={{
              transitionDuration,
              transitionProperty: 'width, left',
            }}
            onClick={() => setModalImg(null)}
          >
            <Image
              src={modalImg}
              alt='enlarged'
              width={800}
              height={800}
              className='min-w-[500px] min-h-[500px] rounded-lg'
            />
          </div>
        )}
      </>
    )
  }

  return (
    <div>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{ a: MarkdownLink, img: MarkdownImage }}
      >
        {preprocessMessage(message.trim(), validMentions)}
      </ReactMarkdown>
    </div>
  )
}
