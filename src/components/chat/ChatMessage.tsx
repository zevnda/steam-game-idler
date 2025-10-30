import type { UserSummary } from '@/types'

import { cn, Tooltip } from '@heroui/react'
import React from 'react'
import ChatAvatar from './ChatAvatar'
import ChatEditControls from './ChatEditControls'
import ChatMessageActions from './ChatMessageActions'
import ChatMessageContent from './ChatMessageContent'
import ChatRoleBadge from './ChatRoleBadge'

import ExtLink from '@/components/ui/ExtLink'

export interface Message {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  avatar_url?: string
}

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
  inputRef: React.RefObject<HTMLTextAreaElement>
  isPinned?: boolean
  onPin?: () => void
  onUnpin?: () => void
  isAdmin?: boolean
}

const ChatMessage: React.FC<ChatMessageProps> = ({
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
}) => {
  const avatarColor = getColorFromUsername(msg.username)
  const showAvatar = idx === 0 || msgs[idx - 1].user_id !== msg.user_id
  const isLastFromUser = idx === msgs.length - 1 || msgs[idx + 1]?.user_id !== msg.user_id
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
        {(isOwnMessage || canEditOrDeleteAny || isAdmin) && (
          <ChatMessageActions
            onEdit={() => {
              setEditingMessageId(msg.id)
              setEditedMessage(msg.message)
            }}
            onDelete={() => handleDeleteMessage(msg.id, msg.user_id)}
            onPin={!isPinned ? onPin : undefined}
            onUnpin={isPinned ? onUnpin : undefined}
            isPinned={isPinned}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  )
}

export default ChatMessage
