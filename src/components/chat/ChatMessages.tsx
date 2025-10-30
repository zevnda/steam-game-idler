import type { UserSummary } from '@/types'
import type { ReactElement } from 'react'

import { open } from '@tauri-apps/plugin-shell'

import { Button, cn, Spinner, Textarea, Tooltip } from '@heroui/react'
import React, { useState } from 'react'
import Image from 'next/image'
import { FaCrown, FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
import { FaEarlybirds, FaShield } from 'react-icons/fa6'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import ExtLink from '@/components/ui/ExtLink'

export interface Message {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  avatar_url?: string
}

interface ChatMessagesProps {
  loading: boolean
  groupedMessages: { [key: string]: Message[] }
  userSummary: UserSummary
  messagesEndRef: React.RefObject<HTMLDivElement>
  messagesContainerRef: React.RefObject<HTMLDivElement>
  handleDeleteMessage: (msgId: string, msgUserId: string) => void
  handleEditMessage: (msgId: string, newContent: string) => void
  getColorFromUsername: (name: string) => string
  userRoles: { [userId: string]: string }
  getRoleColor: (role: string) => string
}

export default function ChatMessages({
  loading,
  groupedMessages,
  userSummary,
  messagesEndRef,
  messagesContainerRef,
  handleDeleteMessage,
  handleEditMessage,
  getColorFromUsername,
  userRoles,
  getRoleColor,
}: ChatMessagesProps): ReactElement {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessage, setEditedMessage] = useState('')

  function MarkdownLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>): ReactElement {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
      e.preventDefault()
      open(props.href || '')
    }
    return (
      <a {...props} onClick={handleClick}>
        {props.children}
      </a>
    )
  }

  // Preprocess message to inject highlight span for @username mentions
  const preprocessMentions = (text: string): string => {
    const username = userSummary?.personaName
    if (!username) return text

    const regex = new RegExp(`(@${username})\\b`, 'gi')
    // eslint-disable-next-line quotes
    return text.replace(regex, `<span class='mention-highlight'>$1</span>`)
  }

  return (
    <div ref={messagesContainerRef} className='flex-1 overflow-y-auto flex flex-col overflow-x-hidden p-4 pb-1'>
      {loading ? (
        <div className='flex justify-center items-center w-calc h-[calc(100vh-168px)]'>
          <Spinner variant='simple' />
        </div>
      ) : Object.keys(groupedMessages).length === 0 ? (
        <div className='flex flex-col items-center justify-center h-full text-center'>
          <div className='text-[#b5bac1] mb-2'>No messages yet</div>
          <div className='text-[#80848e] text-sm'>Be the first to say hi! 👋</div>
        </div>
      ) : (
        <div>
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className='flex items-center my-4'>
                <div className='flex-1 h-px bg-[#3f4147]' />
                <span className='px-2 text-xs text-[#949ba4] font-semibold'>{date}</span>
                <div className='flex-1 h-px bg-[#3f4147]' />
              </div>

              {/* Messages for this date */}
              {msgs.map((msg, idx) => {
                const avatarColor = getColorFromUsername(msg.username)
                const isOwnMessage = msg.user_id === (userSummary?.steamId || '')
                const currentUserRole = userRoles[userSummary?.steamId || ''] || 'user'
                const canEditOrDeleteAny = currentUserRole === 'admin' || currentUserRole === 'mod'
                const showAvatar = idx === 0 || msgs[idx - 1].user_id !== msg.user_id
                const isLastFromUser = idx === msgs.length - 1 || msgs[idx + 1]?.user_id !== msg.user_id

                const isAdmin = userRoles[msg.user_id] === 'admin'
                const isModerator = userRoles[msg.user_id] === 'moderator'
                const isEarlySupporter = userRoles[msg.user_id] === 'early_supporter'

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'group hover:bg-white/3 px-4 py-0 -mx-4 transition-colors duration-75 flex relative',
                      isLastFromUser && 'mb-4',
                    )}
                  >
                    <div className='flex gap-4 flex-1'>
                      {/* Avatar */}
                      {showAvatar ? (
                        <ExtLink
                          href={`https://steamcommunity.com/profiles/${msg.user_id}`}
                          className='flex-shrink-0 mt-1 select-none'
                        >
                          <Image
                            src={
                              msg?.avatar_url ||
                              `https://ui-avatars.com/api/?name=${msg.username}&background=${avatarColor}&color=fff`
                            }
                            alt={msg.username}
                            width={32}
                            height={32}
                            className='rounded-full'
                          />
                        </ExtLink>
                      ) : (
                        <div className='w-8' />
                      )}

                      {/* Message content */}
                      <div className='flex-1 min-w-0'>
                        {showAvatar && (
                          <div className='flex items-baseline gap-2'>
                            <ExtLink
                              href={`https://steamcommunity.com/profiles/${msg.user_id}`}
                              className='font-medium text-white cursor-pointer text-xs group'
                            >
                              <span
                                style={{
                                  color: getRoleColor(userRoles[msg.user_id] || 'user'),
                                  fontWeight: userRoles[msg.user_id] ? 'bold' : 'normal',
                                }}
                                className='mr-1'
                                onMouseEnter={e => {
                                  e.currentTarget.style.textDecoration = 'underline'
                                  e.currentTarget.style.textDecorationColor = getRoleColor(
                                    userRoles[msg.user_id] || 'user',
                                  )
                                  e.currentTarget.style.textUnderlineOffset = '1px'
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.textDecoration = ''
                                  e.currentTarget.style.textDecorationColor = ''
                                  e.currentTarget.style.textUnderlineOffset = ''
                                }}
                              >
                                {msg.username}
                                {isAdmin ? (
                                  <Tooltip content='Admin' className='text-xs' delay={500} closeDelay={0} showArrow>
                                    <FaCrown className='inline ml-1 -translate-y-0.5' size={14} />
                                  </Tooltip>
                                ) : isModerator ? (
                                  <Tooltip content='Moderator' className='text-xs' delay={500} closeDelay={0} showArrow>
                                    <FaShield className='inline ml-1 -translate-y-0.5' size={14} />
                                  </Tooltip>
                                ) : isEarlySupporter ? (
                                  <Tooltip
                                    content='Early Supporter'
                                    className='text-xs'
                                    delay={500}
                                    closeDelay={0}
                                    showArrow
                                  >
                                    <FaEarlybirds className='inline ml-1 -translate-y-0.5' size={14} />
                                  </Tooltip>
                                ) : (
                                  ''
                                )}
                              </span>
                            </ExtLink>

                            {canEditOrDeleteAny && <span className='text-[10px] text-[#949ba4]'>{msg.user_id}</span>}

                            <Tooltip
                              content={new Date(msg.created_at).toUTCString()}
                              className='text-xs'
                              delay={1000}
                              closeDelay={0}
                              showArrow
                            >
                              <span className='text-[10px] text-[#949ba4] select-none'>
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </Tooltip>
                          </div>
                        )}

                        {/* Message rendering: ensure newlines are preserved, support editing */}
                        <div
                          className={cn(
                            'chat-message text-[#dbdee1] break-words text-xs w-fit',
                            showAvatar ? 'leading-[1.375rem]' : 'leading-[1.375rem]',
                          )}
                        >
                          {editingMessageId === msg.id ? (
                            <form
                              onSubmit={e => {
                                e.preventDefault()
                                handleEditMessage(msg.id, editedMessage)
                                setEditingMessageId(null)
                              }}
                              className='flex flex-col gap-2'
                            >
                              <Textarea
                                value={editedMessage}
                                className='min-w-[700px]'
                                classNames={{
                                  inputWrapper: cn(
                                    'bg-input data-[hover=true]:!bg-inputhover rounded-md',
                                    'group-data-[focus-within=true]:!bg-inputhover',
                                    'group-data-[focus-visible=true]:ring-transparent',
                                    'group-data-[focus-visible=true]:ring-offset-transparent',
                                  ),
                                  input: [
                                    '!min-h-8 !text-content text-xs placeholder:text-xs placeholder:text-altwhite/50 pt-2',
                                  ],
                                }}
                                minRows={1}
                                maxRows={15}
                                onChange={e => setEditedMessage(e.target.value)}
                                autoFocus
                              />
                              <div className='flex gap-2'>
                                <button
                                  type='submit'
                                  className='text-dynamic hover:text-dynamic-hover rounded text-[10px] cursor-pointer'
                                >
                                  Save
                                </button>
                                <button
                                  type='button'
                                  className='text-dynamic hover:text-dynamic-hover rounded text-[10px] cursor-pointer'
                                  onClick={() => setEditingMessageId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <ReactMarkdown
                              rehypePlugins={[rehypeRaw]}
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              components={{
                                a: MarkdownLink,
                                // No need for text override, highlight is done in preprocess
                              }}
                            >
                              {preprocessMentions(msg.message.trim().replace(/\n{2,}/g, '\n'))}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>

                      {/* Edit/Delete buttons for own messages or if admin/mod */}
                      {(isOwnMessage || canEditOrDeleteAny) && (
                        <div className='absolute right-4 -top-2 flex opacity-0 group-hover:opacity-100 z-10 bg-[#181818] rounded-sm border border-[#1e1e1e]'>
                          {/* Edit button */}
                          <Button
                            isIconOnly
                            radius='none'
                            className={cn(
                              'bg-transparent h-6 w-5 flex items-center justify-center',
                              'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
                            )}
                            startContent={<FaPencilAlt size={12} className='text-altwhite' />}
                            onPress={() => {
                              setEditingMessageId(msg.id)
                              setEditedMessage(msg.message)
                            }}
                          />

                          {/* Delete button */}
                          <Button
                            isIconOnly
                            radius='none'
                            className={cn(
                              'bg-transparent h-6 w-5 flex items-center justify-center',
                              'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
                            )}
                            startContent={<FaTrashAlt size={12} className='text-[#f23f43]' />}
                            onPress={() => handleDeleteMessage(msg.id, msg.user_id)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}
