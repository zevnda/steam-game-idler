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

import { Children, isValidElement, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { BsArrow90DegRight } from 'react-icons/bs'
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

// Custom blockquote renderer to inject the arrow icon
const MarkdownBlockquote = (
  props: BlockquoteHTMLAttributes<HTMLQuoteElement> & { children?: ReactNode },
): ReactElement => {
  // Check if any child contains ':arrow:'
  let hasArrow = false
  Children.forEach(props.children, child => {
    if (typeof child === 'string' && child.includes(':arrow:')) {
      hasArrow = true
    }
    if (
      isValidElement(child) &&
      (child.props as { children?: ReactNode }) &&
      typeof (child.props as { children?: ReactNode }).children === 'string'
    ) {
      if (((child.props as { children?: ReactNode }).children as string).includes(':arrow:')) {
        hasArrow = true
      }
    }
    if (
      isValidElement(child) &&
      (child.props as { children?: ReactNode }) &&
      Array.isArray((child.props as { children?: ReactNode }).children)
    ) {
      const childrenArr = (child.props as { children?: ReactNode }).children as unknown[]
      if (
        childrenArr.length > 0 &&
        typeof childrenArr[0] === 'string' &&
        (childrenArr[0] as string).includes(':arrow:')
      ) {
        hasArrow = true
      }
    }
  })

  // Replace ':arrow:' with the icon
  const replaced = Children.map(props.children, child => {
    if (typeof child === 'string') {
      return child.replace(':arrow:', '') // Remove the placeholder if present
    }

    if (
      isValidElement(child) &&
      (child.props as { children?: ReactNode }) &&
      typeof (child.props as { children?: ReactNode }).children === 'string'
    ) {
      const text = (child.props as { children?: ReactNode }).children as string
      if (text.startsWith(':arrow:')) {
        return (
          <p>
            <BsArrow90DegRight className='inline mr-1' />
            {text.replace(':arrow:', '')}
          </p>
        )
      }
    }

    if (
      isValidElement(child) &&
      (child.props as { children?: ReactNode }) &&
      Array.isArray((child.props as { children?: ReactNode }).children)
    ) {
      const childrenArr = (child.props as { children?: ReactNode }).children as ReactNode[]
      if (
        childrenArr.length > 0 &&
        typeof childrenArr[0] === 'string' &&
        (childrenArr[0] as string).startsWith(':arrow:')
      ) {
        return (
          <p>
            <BsArrow90DegRight className='inline mr-1' />
            {(childrenArr[0] as string).replace(':arrow:', '')}
            {childrenArr.slice(1) as ReactNode[]}
          </p>
        )
      }
    }
    return child
  })

  return (
    <blockquote
      style={
        hasArrow ? { paddingLeft: '2px', userSelect: 'none' } : { borderLeft: '4px solid #555559', paddingLeft: '6px' }
      }
    >
      {replaced}
    </blockquote>
  )
}

export default function ChatMessageContent({ message, userSummary }: ChatMessageContentProps): ReactElement {
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
          blockquote: MarkdownBlockquote,
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
