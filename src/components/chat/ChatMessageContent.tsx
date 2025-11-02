import type { UserSummary } from '@/types'
import type {
  AnchorHTMLAttributes,
  BlockquoteHTMLAttributes,
  ImgHTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react'

import { open } from '@tauri-apps/plugin-shell'

import 'react-image-lightbox/style.css'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Lightbox from 'react-image-lightbox'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import ExtLink from '@/components/ui/ExtLink'

interface ChatMessageContentProps {
  message: string
  userSummary: UserSummary
  isAdmin?: boolean
  isPinned?: boolean
  onPin?: (message: string) => void
  onUnpin?: () => void
  replyToId?: string | null
  scrollToMessage?: (messageId: string) => Promise<void>
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
  // Replace image URLs with Markdown image syntax
  const imageUrlRegex = /(https?:\/\/(?:[\w.-]+)\/(?:[\w\-./%]+)\.(?:jpg|jpeg|png|gif|webp|svg))(?![^\s])/gi
  processed = processed.replace(imageUrlRegex, url => `![](${url})`)

  if (validMentions && validMentions.length > 0) {
    validMentions.forEach(username => {
      // Escape username for regex safety
      const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match @username with robust boundaries (start, end, whitespace, punctuation, blockquote)
      const regex = new RegExp(`(?<=^|\\s|[>])@${escapedUsername}(?=$|\\s|[.,!?;:])`, 'g')
      processed = processed.replace(regex, `<span class='mention-highlight'>@${username}</span>`)
    })
  }
  return processed
}

// Helper function to detect if message contains only emojis
const isEmojiOnly = (text: string): boolean => {
  // Remove whitespace and check if remaining content is only emojis
  const trimmed = text.trim()
  // Regex to match emojis (including modifiers and compound emojis)
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)+$/u
  return emojiRegex.test(trimmed)
}

// Custom blockquote renderer
const MarkdownBlockquote = (
  props: BlockquoteHTMLAttributes<HTMLQuoteElement> & { children?: ReactNode },
): ReactElement => {
  return <blockquote style={{ borderLeft: '4px solid #555559', paddingLeft: '6px' }}>{props.children}</blockquote>
}

export default function ChatMessageContent({ message }: ChatMessageContentProps): ReactElement {
  const [modalImg, setModalImg] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [validMentions, setValidMentions] = useState<string[]>([])

  // Extract all @username patterns from the message and check Supabase
  useEffect(() => {
    // Split message into words and try to match all possible @mentions
    const words = message.split(/\s+/)
    const candidates: string[] = []
    for (let i = 0; i < words.length; i++) {
      if (words[i].startsWith('@')) {
        // Try to build multi-word usernames up to 5 words (adjust as needed)
        for (let len = 1; len <= 5 && i + len - 1 < words.length; len++) {
          const candidate = words
            .slice(i, i + len)
            .join(' ')
            .replace(/^@/, '')
            .trim()
          if (candidate.length > 0) candidates.push(candidate)
        }
      }
    }
    if (candidates.length === 0) {
      setValidMentions([])
      return
    }
    // Query Supabase for these usernames
    const fetchMentions = async (): Promise<void> => {
      const { data, error } = await supabase.from('users').select('username').in('username', candidates)
      if (!error && Array.isArray(data)) {
        setValidMentions(data.map(u => u.username))
      } else {
        setValidMentions([])
      }
    }
    fetchMentions()
  }, [message])

  // Custom image renderer for markdown
  const MarkdownImage = (props: ImgHTMLAttributes<HTMLImageElement>): ReactElement => {
    return (
      <Image
        src={typeof props.src === 'string' ? props.src : ''}
        alt={props.alt || 'image'}
        width={200}
        height={200}
        className='max-w-[200px] h-[200px] object-cover cursor-pointer rounded-lg my-2'
        onClick={() => {
          if (typeof props.src === 'string') {
            setModalImg(props.src)
            setLightboxOpen(true)
          }
        }}
      />
    )
  }

  return (
    <div className={isEmojiOnly(message) ? 'emoji-only-message' : ''}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          a: MarkdownLink,
          img: MarkdownImage,
          blockquote: props => MarkdownBlockquote(props),
        }}
      >
        {preprocessMessage(message.trim(), validMentions)}
      </ReactMarkdown>

      {lightboxOpen && modalImg && (
        <Lightbox
          mainSrc={modalImg}
          onCloseRequest={() => setLightboxOpen(false)}
          imagePadding={100}
          imageTitle={
            <ExtLink href={modalImg} className='text-sm p-4'>
              {modalImg}
            </ExtLink>
          }
        />
      )}
    </div>
  )
}
