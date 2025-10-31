import type { UserSummary } from '@/types'
import type { ReactElement, RefObject } from 'react'

import { cn, Tooltip } from '@heroui/react'
import ChatAvatar from './ChatAvatar'
import ChatEditControls from './ChatEditControls'
import ChatMessageActions from './ChatMessageActions'
import ChatMessageContent from './ChatMessageContent'
import ChatRoleBadge from './ChatRoleBadge'

import ExtLink from '@/components/ui/ExtLink'

interface ChatMessageProps {
  msg: Message
  idx: number
  msgs: Message[]
  userSummary: UserSummary
  userRoles: { [userId: string]: string }
  getColorFromUsername: (name: string) => string
  getRoleColor: (role: string) => string
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
  onReply?: () => void // Add this
}

export interface Message {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  avatar_url?: string
}

export default function ChatMessage({
  msg,
  idx,
  msgs,
  userSummary,
  userRoles,
  getColorFromUsername,
  getRoleColor,
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
}: ChatMessageProps): ReactElement {
  // Collect all usernames from msgs for mention highlighting
  const avatarColor = getColorFromUsername(msg.username)

  // Show avatar if first message, or previous message is from a different user, or more than 1 minute has passed since previous message
  let showAvatar = true
  if (idx > 0) {
    const prevMsg = msgs[idx - 1]
    const prevTime = new Date(prevMsg.created_at).getTime()
    const currTime = new Date(msg.created_at).getTime()
    const timeDiff = currTime - prevTime
    // 1 minute = 60,000 ms
    if (prevMsg.user_id === msg.user_id && timeDiff <= 60000) {
      showAvatar = false
    }
  }

  // End group if next message is from a different user or more than 1 minute apart
  const isLastFromUser =
    idx === msgs.length - 1 ||
    msgs[idx + 1]?.user_id !== msg.user_id ||
    (msgs[idx + 1] && new Date(msgs[idx + 1].created_at).getTime() - new Date(msg.created_at).getTime() > 60000)
  const currentRole = userRoles[msg.user_id] || 'user'

  return (
    <div
      key={msg.id}
      className={cn(
        'group hover:bg-white/3 px-4 py-0 -mx-4 transition-colors duration-75 flex relative',
        isLastFromUser && 'mb-3',
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
          {showAvatar && (
            <div className='flex items-baseline gap-2'>
              <ExtLink href={`https://steamcommunity.com/profiles/${msg.user_id}`}>
                <span
                  style={{
                    color: getRoleColor(currentRole),
                    fontWeight: userRoles[msg.user_id] ? 'bold' : 'normal',
                  }}
                  className='mr-1 text-xs'
                >
                  {msg.username}
                  <ChatRoleBadge role={currentRole} />
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
          <div className='chat-message text-[#dbdee1] break-words text-xs w-fit leading-[1.375rem]'>
            {editingMessageId === msg.id ? (
              <ChatEditControls
                isEditing={true}
                editedMessage={editedMessage}
                setEditedMessage={setEditedMessage}
                onSave={() => {
                  handleEditMessage(msg.id, editedMessage)
                  setEditingMessageId(null)
                }}
                onCancel={() => setEditingMessageId(null)}
                textareaRef={inputRef}
              />
            ) : (
              <ChatMessageContent
                message={msg.message}
                userSummary={userSummary}
                isPinned={isPinned}
                onPin={onPin}
                onUnpin={onUnpin}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </div>
        <ChatMessageActions
          onEdit={
            isOwnMessage || canEditOrDeleteAny || isAdmin
              ? () => {
                  setEditingMessageId(msg.id)
                  setEditedMessage(msg.message)
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
        />
      </div>
    </div>
  )
}
