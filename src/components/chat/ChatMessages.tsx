import type { ChatMessageType } from '@/hooks/chat/useMessages'
import type { UserSummary } from '@/types'
import type { ReactElement, RefObject } from 'react'

import { Spinner } from '@heroui/react'
import { memo, useEffect, useRef } from 'react'
import ChatDateDivider from './ChatDateDivider'
import ChatMessage from './ChatMessage'

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
  messagesEndRef: RefObject<HTMLDivElement>
  messagesContainerRef: RefObject<HTMLDivElement>
  handleDeleteMessage: (msgId: string, msgUserId: string) => void
  handleEditMessage: (msgId: string, newContent: string) => void
  getColorFromUsername: (name: string) => string
  userRoles: { [userId: string]: string }
  getRoleColor: (role: string) => string
  inputRef: RefObject<HTMLTextAreaElement>
  pinnedMessageId?: string | null
  handlePinMessage?: (message: ChatMessageType) => void
  handleUnpinMessage?: () => void
  isAdmin?: boolean
  onReply?: (msg: Message) => void // Add this
}

const ChatMessages = ({
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
  editingMessageId,
  setEditingMessageId,
  editedMessage,
  setEditedMessage,
  inputRef,
  pinnedMessageId,
  handlePinMessage,
  handleUnpinMessage,
  isAdmin,
  onReply,
}: ChatMessagesProps & {
  editingMessageId: string | null
  setEditingMessageId: (id: string | null) => void
  editedMessage: string
  setEditedMessage: (msg: string) => void
  pinnedMessageId?: string | null
  handlePinMessage?: (message: ChatMessageType) => void
  handleUnpinMessage?: () => void
  isAdmin?: boolean
  onReply?: (msg: Message) => void
}): ReactElement => {
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editingMessageId) return
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setEditingMessageId(null)
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleEsc)
    if (editTextareaRef.current) {
      const len = editTextareaRef.current.value.length
      editTextareaRef.current.focus()
      editTextareaRef.current.setSelectionRange(len, len)
    }
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [inputRef, editingMessageId, setEditingMessageId])

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
              <ChatDateDivider date={date} />
              {msgs.map((msg, idx) => {
                const isOwnMessage = msg.user_id === (userSummary?.steamId || '')
                const currentUserRole = userRoles[userSummary?.steamId || ''] || 'user'
                const canEditOrDeleteAny = currentUserRole === 'admin' || currentUserRole === 'mod'

                // If this is the pinned message group, always set isPinned true
                const isPinnedMessage = date === 'Pinned' || pinnedMessageId === msg.id
                return (
                  <ChatMessage
                    key={msg.id}
                    msg={msg}
                    idx={idx}
                    msgs={msgs}
                    userSummary={userSummary}
                    userRoles={userRoles}
                    getColorFromUsername={getColorFromUsername}
                    getRoleColor={getRoleColor}
                    isOwnMessage={isOwnMessage}
                    canEditOrDeleteAny={canEditOrDeleteAny}
                    editingMessageId={editingMessageId}
                    setEditingMessageId={setEditingMessageId}
                    editedMessage={editedMessage}
                    setEditedMessage={setEditedMessage}
                    handleEditMessage={handleEditMessage}
                    handleDeleteMessage={handleDeleteMessage}
                    inputRef={inputRef}
                    isPinned={isPinnedMessage}
                    onPin={() => handlePinMessage && handlePinMessage(msg)}
                    onUnpin={handleUnpinMessage}
                    isAdmin={isAdmin}
                    onReply={onReply ? () => onReply(msg) : undefined}
                  />
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

export default memo(ChatMessages)
