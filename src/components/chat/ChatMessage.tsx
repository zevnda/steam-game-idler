import type { UserSummary } from '@/types'
import type { ReactElement, RefObject } from 'react'

import { cn, Tooltip } from '@heroui/react'
import { memo } from 'react'

import ChatAvatar from '@/components/chat/ChatAvatar'
import ChatEditControls from '@/components/chat/ChatEditControls'
import ChatMessageActions from '@/components/chat/ChatMessageActions'
import ChatMessageContent from '@/components/chat/ChatMessageContent'
import ChatMessageReactions from '@/components/chat/ChatMessageReactions'
import ChatRoleBadge from '@/components/chat/ChatRoleBadge'
import ExtLink from '@/components/ui/ExtLink'
import { supabase } from '@/utils/supabaseClient'
import { logEvent } from '@/utils/tasks'

interface ChatMessageProps {
  msg: Message
  idx: number
  msgs: Message[]
  userSummary: UserSummary
  userRoles: { [userId: string]: string }
  getColorFromUsername: (name: string) => string
  getRoleStyles: (role: string) => string
  isOwnMessage: boolean
  canEditOrDeleteAny: boolean
  editingMessageId: string | null
  setEditingMessageId: (id: string | null) => void
  editedMessage: string
  setEditedMessage: (msg: string) => void
  handleEditMessage: (msgId: string, newContent: string) => void
  handleDeleteMessage: (msgId: string, msgUserId: string) => void
  inputRef: RefObject<HTMLTextAreaElement>
  isPinned?: boolean
  onPin?: () => void
  onUnpin?: () => void
  isAdmin?: boolean
  onReply?: () => void
  scrollToMessage?: (messageId: string) => Promise<void>
  isShiftPressed?: boolean
  onAddReaction?: (messageId: string, emoji: string) => void
  onRemoveReaction?: (messageId: string, emoji: string) => void
  messagesContainerRef?: RefObject<HTMLDivElement>
}

export interface Message {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  avatar_url?: string
  reply_to_id?: string | null
  reply_to?: Message | null
  reactions?: Array<{
    emoji: string
    user_ids: string[]
    usernames: string[]
    count: number
  }>
}

function ChatMessage({
  msg,
  idx,
  msgs,
  userSummary,
  userRoles,
  getColorFromUsername,
  getRoleStyles,
  isOwnMessage,
  canEditOrDeleteAny,
  editingMessageId,
  setEditingMessageId,
  editedMessage,
  setEditedMessage,
  handleEditMessage,
  handleDeleteMessage,
  inputRef,
  isPinned,
  onPin,
  onUnpin,
  isAdmin,
  onReply,
  scrollToMessage,
  onAddReaction,
  onRemoveReaction,
  messagesContainerRef,
}: ChatMessageProps): ReactElement {
  // Use pre-fetched reply data or fallback to searching in msgs array
  const replyToMessage = msg.reply_to || (msg.reply_to_id ? msgs.find(m => m.id === msg.reply_to_id) : null)

  const avatarColor = getColorFromUsername(msg.username)

  // Show avatar if first message, or previous message is from a different user, or more than 3 minute has passed since previous message, or if message is a reply
  let showAvatar = true
  if (idx > 0 && !msg.reply_to_id) {
    const prevMsg = msgs[idx - 1]
    const prevTime = new Date(prevMsg.created_at).getTime()
    const currTime = new Date(msg.created_at).getTime()
    const timeDiff = currTime - prevTime
    if (prevMsg.user_id === msg.user_id && timeDiff <= 3 * 60 * 1000) {
      showAvatar = false
    }
  }

  // End group if next message is from a different user or more than 3 minute apart or if next message is a reply
  const isLastFromUser =
    idx < msgs.length - 1 &&
    (msgs[idx + 1]?.user_id !== msg.user_id ||
      msgs[idx + 1]?.reply_to_id ||
      (msgs[idx + 1] &&
        new Date(msgs[idx + 1].created_at).getTime() - new Date(msg.created_at).getTime() > 3 * 60 * 1000))

  const currentRole = userRoles[msg.user_id] || 'user'

  // Ban/Unban user handler
  const handleBanUser = async (): Promise<void> => {
    try {
      // Check current role
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', msg.user_id)
        .single()
      if (fetchError) {
        console.error('Error fetching user role:', fetchError)
        logEvent(`[Error] in handleBanUser (fetch): ${fetchError.message}`)
        return
      }
      const currentRole = userData?.role || 'user'
      const newRole = currentRole === 'banned' ? 'user' : 'banned'
      const { error: updateError } = await supabase.from('users').update({ role: newRole }).eq('user_id', msg.user_id)
      if (updateError) {
        console.error('Error updating user role:', updateError)
        logEvent(`[Error] in handleBanUser (update): ${updateError.message}`)
      }
    } catch (error) {
      console.error('Error in handleBanUser:', error)
      logEvent(`[Error] in handleBanUser: ${error}`)
    }
  }

  // Highlight if message mentions us (username or steamId)
  const mentionRegex = userSummary
    ? new RegExp(
        `@(${userSummary.personaName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}|${userSummary.steamId})\\b`,
        'i',
      )
    : null
  const isMentioned = mentionRegex ? mentionRegex.test(msg.message) : false

  // Check if message is replying to us
  const isReplyingToUs =
    userSummary && msg.reply_to_id ? msgs.find(m => m.id === msg.reply_to_id)?.user_id === userSummary.steamId : false

  return (
    <div
      key={msg.id}
      data-message-id={msg.id}
      className={cn(
        'group px-4 py-0 -mx-4 transition-colors duration-75 flex relative',
        isLastFromUser && 'mb-3',
        isMentioned || isReplyingToUs
          ? 'bg-blue-900/15 border-l-2 border-blue-400 hover:bg-blue-900/25'
          : 'hover:bg-white/3',
      )}
    >
      <div className='flex gap-4 flex-1'>
        {showAvatar ? (
          <ChatAvatar
            userId={msg.user_id}
            username={msg.username}
            avatarUrl={msg.avatar_url}
            avatarColor={avatarColor}
          />
        ) : (
          <div className='w-8' />
        )}

        <div className='flex-1 min-w-0'>
          {/* Reply preview */}
          {replyToMessage && (
            <div
              className='flex items-center gap-1 -mb-1.5 cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => scrollToMessage?.(msg.reply_to_id!)}
            >
              <div className='w-6 h-2 border-l-1 border-t-1 border-[#4e5058] rounded-tl-md -mb-2' />
              <span className='text-[10px] text-[#b5bac1] font-medium'>{replyToMessage.username}</span>
              <span className='text-[10px] text-[#949ba4] truncate'>
                {replyToMessage.message.substring(0, 50)}
                {replyToMessage.message.length > 50 ? '...' : ''}
              </span>
            </div>
          )}

          {showAvatar && (
            <div className='flex items-baseline gap-2'>
              <ExtLink href={`https://steamcommunity.com/profiles/${msg.user_id}`}>
                <span
                  style={{
                    fontWeight: userRoles[msg.user_id] ? 'bold' : 'normal',
                  }}
                  className={cn('mr-1 text-xs text-[#3f3f3f] inline-flex items-center', getRoleStyles(currentRole))}
                >
                  {msg.username}
                  <ChatRoleBadge role={currentRole} />
                </span>
              </ExtLink>

              {canEditOrDeleteAny && <span className='text-[10px] text-[#949ba4]'>{msg.user_id}</span>}

              <Tooltip
                content={new Date(msg.created_at).toUTCString()}
                className='text-xs bg-[#0a0a0a] text-content'
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
          <div className='chat-message text-[#dbdee1] wrap-break-words text-xs w-full leading-5.5'>
            {editingMessageId === msg.id ? (
              <ChatEditControls
                isEditing={true}
                editedMessage={editedMessage}
                setEditedMessage={setEditedMessage}
                onSave={newContent => {
                  handleEditMessage(msg.id, newContent)
                  setEditingMessageId(null)
                }}
                onCancel={() => setEditingMessageId(null)}
                textareaRef={inputRef}
              />
            ) : (
              <ChatMessageContent message={msg.message} />
            )}
          </div>

          {/* Message Reactions */}
          {msg.reactions && msg.reactions.length > 0 && onAddReaction && onRemoveReaction && userSummary?.steamId && (
            <div className={msg.reactions && msg.reactions.length > 0 ? '' : 'opacity-0 group-hover:opacity-100'}>
              <ChatMessageReactions
                messageId={msg.id}
                reactions={msg.reactions || []}
                userSteamId={userSummary.steamId}
                onAddReaction={onAddReaction}
                onRemoveReaction={onRemoveReaction}
              />
            </div>
          )}
        </div>
        <ChatMessageActions
          onEdit={
            isOwnMessage || canEditOrDeleteAny || isAdmin
              ? () => {
                  setEditingMessageId(msg.id)
                  setEditedMessage(msg.message)
                  // Scroll the message into view after a brief delay to ensure textarea is rendered
                  setTimeout(() => {
                    const messageElement = document.querySelector(`[data-message-id="${msg.id}"]`)
                    if (messageElement && messagesContainerRef?.current) {
                      const container = messagesContainerRef.current
                      const messageRect = messageElement.getBoundingClientRect()
                      const containerRect = container.getBoundingClientRect()

                      // Check if message is partially or fully out of view
                      const isOutOfView =
                        messageRect.bottom > containerRect.bottom || messageRect.top < containerRect.top

                      if (isOutOfView) {
                        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                      }
                    }
                  }, 100)
                }
              : undefined
          }
          onDelete={
            isOwnMessage || canEditOrDeleteAny || isAdmin ? () => handleDeleteMessage(msg.id, msg.user_id) : undefined
          }
          onPin={!isPinned ? onPin : undefined}
          onUnpin={isPinned ? onUnpin : undefined}
          isPinned={isPinned}
          isAdmin={isAdmin}
          onReply={onReply}
          onBan={isAdmin ? handleBanUser : undefined}
          onAddReaction={onAddReaction ? (emoji: string) => onAddReaction(msg.id, emoji) : undefined}
        />
      </div>
    </div>
  )
}

export default memo(ChatMessage)
