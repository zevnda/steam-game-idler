import type { Message } from '@/components/chat/ChatMessage'
import type { ChatMessageType } from '@/hooks/chat/useMessages'
import type { UserSummary } from '@/types'
import type { ReactElement, RefObject } from 'react'

import { memo, useEffect, useRef } from 'react'

import ChatDateDivider from '@/components/chat/ChatDateDivider'
import ChatMessage from '@/components/chat/ChatMessage'
import Loader from '@/components/ui/Loader'

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
  getRoleStyles: (role: string) => string
  inputRef: RefObject<HTMLTextAreaElement>
  pinnedMessageId?: string | null
  handlePinMessage?: (message: ChatMessageType) => void
  handleUnpinMessage?: () => void
  isAdmin?: boolean
  onReply?: (msg: Message) => void
  scrollToMessage?: (messageId: string) => Promise<void>
  isShiftPressed?: boolean
  onAddReaction?: (messageId: string, emoji: string) => void
  onRemoveReaction?: (messageId: string, emoji: string) => void
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
  getRoleStyles,
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
  scrollToMessage,
  isShiftPressed,
  onAddReaction,
  onRemoveReaction,
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

  // Flatten all messages from all date groups for reply lookups
  const allMessages = Object.values(groupedMessages).flat()

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
    <div
      ref={messagesContainerRef}
      className='message-render flex-1 overflow-y-auto flex flex-col overflow-x-hidden p-4 pb-1'
    >
      {Object.keys(groupedMessages).length === 0 ? (
        <Loader styles='w-full h-full' />
      ) : (
        <>
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
                    msgs={allMessages}
                    userSummary={userSummary}
                    userRoles={userRoles}
                    getColorFromUsername={getColorFromUsername}
                    getRoleStyles={getRoleStyles}
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
                    scrollToMessage={scrollToMessage}
                    isShiftPressed={isShiftPressed}
                    onAddReaction={onAddReaction}
                    onRemoveReaction={onRemoveReaction}
                    messagesContainerRef={messagesContainerRef}
                  />
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}

export default memo(ChatMessages)
