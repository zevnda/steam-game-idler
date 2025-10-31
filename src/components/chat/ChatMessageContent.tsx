import type { UserSummary } from '@/types'
import type { AnchorHTMLAttributes, MouseEvent, ReactElement } from 'react'

import { open } from '@tauri-apps/plugin-shell'

import { cn } from '@heroui/react'
import React, { useState } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkBreaks from 'remark-breaks'
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

const preprocessMessage = (text: string, username?: string): string => {
  let processed = text
  if (username) {
    const regex = new RegExp(`(@${username})\\b`, 'gi')
    // eslint-disable-next-line quotes
    processed = processed.replace(regex, `<span class='mention-highlight'>$1</span>`)
  }
  return processed
}

const FIXED_IMG_SIZE = 200

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ message, userSummary }: ChatMessageContentProps) => {
  const [modalImg, setModalImg] = useState<string | null>(null)
  const { sidebarCollapsed, transitionDuration } = useStateContext()

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
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{ a: MarkdownLink, img: MarkdownImage }}
      >
        {preprocessMessage(message.trim(), userSummary?.personaName)}
      </ReactMarkdown>
    </div>
  )
}

export default ChatMessageContent
