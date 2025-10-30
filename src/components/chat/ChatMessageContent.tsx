import type { UserSummary } from '@/types'
import type { AnchorHTMLAttributes, MouseEvent, ReactElement } from 'react'

import { open } from '@tauri-apps/plugin-shell'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

interface ChatMessageContentProps {
  message: string
  userSummary: UserSummary
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

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ message, userSummary }: ChatMessageContentProps) => (
  <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm, remarkBreaks]} components={{ a: MarkdownLink }}>
    {preprocessMessage(message.trim(), userSummary?.personaName)}
  </ReactMarkdown>
)

export default ChatMessageContent
