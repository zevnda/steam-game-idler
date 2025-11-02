import type { UserSummary } from '@/types'
import type { AnchorHTMLAttributes, ImgHTMLAttributes, MouseEvent, ReactElement } from 'react'

import 'github-markdown-css/github-markdown.css'

import { open } from '@tauri-apps/plugin-shell'

import 'react-image-lightbox/style.css'

import type { Components } from 'react-markdown'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Lightbox from 'react-image-lightbox'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import ExtLink from '@/components/ui/ExtLink'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

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

// Helper function to detect if message contains only emojis
const isEmojiOnly = (text: string): boolean => {
  const trimmed = text.trim()
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)+$/u
  return emojiRegex.test(trimmed)
}

// Extract mention candidates more efficiently
const extractMentionCandidates = (message: string): string[] => {
  const candidates = new Set<string>()
  const words = message.split(/\s+/)

  for (let i = 0; i < words.length; i++) {
    if (!words[i].startsWith('@')) continue

    // Try multi-word combinations (up to 5 words)
    for (let len = 1; len <= 5 && i + len <= words.length; len++) {
      const candidate = words
        .slice(i, i + len)
        .join(' ')
        .slice(1) // Remove @ prefix
        .trim()

      if (candidate) candidates.add(candidate)
    }
  }

  return Array.from(candidates)
}

// Cache for username validation to avoid redundant queries
const usernameCache = new Map<string, boolean>()

export default function ChatMessageContent({ message }: ChatMessageContentProps): ReactElement {
  const [modalImg, setModalImg] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [processedMessage, setProcessedMessage] = useState(message)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Memoize emoji check
  const isEmoji = useMemo(() => isEmojiOnly(message), [message])

  const handleImageClick = useCallback((src: string) => {
    setModalImg(src)
    setLightboxOpen(true)
  }, [])

  const handleLightboxClose = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  // Custom mention renderer
  const MentionComponent = useCallback(
    ({ node, ...props }: { node?: unknown; [key: string]: unknown }): ReactElement => {
      const nodeProps = node as { properties?: { dataUser?: string } }
      const username = nodeProps?.properties?.dataUser || (props['data-user'] as string)
      return (
        <span className='bg-blue-600/20 text-blue-400 px-1 rounded font-medium hover:bg-blue-600/30 transition-colors'>
          @{username}
        </span>
      )
    },
    [],
  )

  // Custom image renderer for markdown
  const MarkdownImage = useCallback(
    (props: ImgHTMLAttributes<HTMLImageElement>): ReactElement => {
      return (
        <Image
          src={typeof props.src === 'string' ? props.src : ''}
          alt={props.alt || 'image'}
          width={200}
          height={200}
          className='max-w-[200px] h-[200px] object-cover cursor-pointer rounded-lg my-2'
          onClick={() => {
            if (typeof props.src === 'string') {
              handleImageClick(props.src)
            }
          }}
        />
      )
    },
    [handleImageClick],
  )

  // Memoize custom components to prevent recreating on every render
  const customComponents = useMemo<Components>(
    () => ({
      a: MarkdownLink,
      img: MarkdownImage,
      mention: MentionComponent,
    }),
    [MarkdownImage, MentionComponent],
  )

  // Combined effect: extract, validate, and process mentions
  useEffect(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    const candidates = extractMentionCandidates(message)

    if (candidates.length === 0) {
      setProcessedMessage(message)
      return
    }

    const validateAndProcessMentions = async (): Promise<void> => {
      try {
        // Separate cached and uncached usernames
        const uncached = candidates.filter(c => !usernameCache.has(c))
        const cachedValid = candidates.filter(c => usernameCache.get(c) === true)

        const validMentions = [...cachedValid]

        // Query only uncached usernames
        if (uncached.length > 0) {
          const { data, error } = await supabase.from('users').select('username').in('username', uncached)

          if (signal.aborted) return

          if (!error && Array.isArray(data)) {
            const validUsernames = data.map(u => u.username)

            // Update cache
            uncached.forEach(username => {
              const isValid = validUsernames.includes(username)
              usernameCache.set(username, isValid)
              if (isValid) validMentions.push(username)
            })
          } else {
            // Cache as invalid on error
            uncached.forEach(username => usernameCache.set(username, false))
          }
        }

        if (signal.aborted) return

        // Process message with valid mentions (longest first to avoid partial replacements)
        const sortedMentions = validMentions.sort((a, b) => b.length - a.length)
        let processed = message

        sortedMentions.forEach(mention => {
          const escapedMention = mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`@${escapedMention}\\b`, 'g')
          processed = processed.replace(regex, `<mention data-user="${mention}">@${mention}</mention>`)
        })

        if (!signal.aborted) {
          setProcessedMessage(processed)
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error('Error processing mentions:', error)
          setProcessedMessage(message)
        }
      }
    }

    validateAndProcessMentions()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [message])

  return (
    <div className={isEmoji ? 'emoji-only-message' : ''}>
      <div className='markdown-body'>
        <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={customComponents}>
          {processedMessage}
        </ReactMarkdown>
      </div>

      {lightboxOpen && modalImg && (
        <Lightbox
          mainSrc={modalImg}
          onCloseRequest={handleLightboxClose}
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
