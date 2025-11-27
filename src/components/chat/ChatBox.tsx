import type { ChatMessageType } from '@/hooks/chat/useMessages'
import type { UserSummary } from '@/types'
import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { cn } from '@heroui/react'
import { useCallback, useMemo, useRef, useState } from 'react'

import ChatBanned from '@/components/chat/ChatBanned'
import ChatInput from '@/components/chat/ChatInput'
import ChatMaintenance from '@/components/chat/ChatMaintenance'
import ChatMessages from '@/components/chat/ChatMessages'
import ChatUserList from '@/components/chat/ChatUserList'
import { useStateContext } from '@/components/contexts/StateContext'
import { useSupabase } from '@/components/contexts/SupabaseContext'
import { useMessageReactions } from '@/hooks/chat/useMessageReactions'
import { useMessages } from '@/hooks/chat/useMessages'
import { usePinnedMessage } from '@/hooks/chat/usePinnedMessage'
import { useScrollToMessage } from '@/hooks/chat/useScrollToMessage'

export default function ChatBox(): ReactElement {
  const { sidebarCollapsed, transitionDuration } = useStateContext()
  const messagesEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const messagesContainerRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const inputRef = useRef<HTMLTextAreaElement>(null as unknown as HTMLTextAreaElement)
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

  const { chatMaintenanceMode, userRoles } = useSupabase()

  const { pinnedMessageId, pinnedMessage, handlePinMessage, handleUnpinMessage, setPinnedMessage } =
    usePinnedMessage() as {
      pinnedMessageId: string | null
      pinnedMessage: ChatMessageType | null
      handlePinMessage: (message: ChatMessageType) => void
      handleUnpinMessage: () => void
      setPinnedMessage: Dispatch<SetStateAction<ChatMessageType | null>>
    }
  const {
    messages,
    loading,
    pagination,
    handleSendMessage,
    handleDeleteMessage,
    handleEditMessage,
    editingMessageId,
    setEditingMessageId,
    editedMessage,
    setEditedMessage,
    handleEditLastMessage,
    groupMessagesByDate,
    isBanned,
    setMessages,
  } = useMessages({
    userSummary,
    userRoles,
    messagesEndRef,
    messagesContainerRef,
    inputRef,
    pinnedMessageId,
    setPinnedMessage,
  })

  const { scrollToMessage } = useScrollToMessage({
    messages,
    setMessages,
    messagesContainerRef,
    pagination,
  })

  const { handleAddReaction, handleRemoveReaction } = useMessageReactions({
    userSteamId: userSummary?.steamId || '',
    username: userSummary?.personaName || '',
  })

  const [replyToMessage, setReplyToMessage] = useState<ChatMessageType | null>(null)

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messagesEndRef])

  const handleReplyToMessage = useCallback(
    (msg: ChatMessageType): void => {
      setReplyToMessage(msg)
      setTimeout(() => {
        scrollToBottom()
        inputRef.current?.focus()
      }, 0)
    },
    [scrollToBottom],
  )

  const getRoleStyles = useMemo(
    () =>
      (role: string): string => {
        switch (role) {
          case 'admin':
            return 'text-[#e91e63]'
          case 'mod':
            return 'text-[#1eb6e9ff]'
          case 'early_supporter':
            return 'text-[#43b581]'
          case 'donator':
            return 'donator-role'
          case 'banned':
            return 'text-[#525252] line-through italic'
          default:
            return 'text-[#dbdee1]'
        }
      },
    [],
  )

  const getColorFromUsername = useMemo(
    () =>
      (name: string): string => {
        const colors = [
          '#f23f43',
          '#f26522',
          '#f0c419',
          '#43b581',
          '#5865f2',
          '#7289da',
          '#9c84ef',
          '#e91e63',
          '#1abc9c',
          '#3498db',
          '#9b59b6',
          '#e67e22',
        ]
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[hash % colors.length]
      },
    [],
  )

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [groupMessagesByDate, messages])

  if (chatMaintenanceMode) {
    return (
      <div
        className={cn(
          'flex flex-col h-screen ease-in-out pt-9',
          sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'width',
        }}
      >
        <ChatMaintenance />
      </div>
    )
  }

  if (isBanned) {
    return (
      <div
        className={cn(
          'flex flex-col h-screen ease-in-out pt-9',
          sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'width',
        }}
      >
        <ChatBanned />
      </div>
    )
  }

  if (!chatMaintenanceMode) {
    return (
      <div
        className={cn(
          'flex flex-col h-screen ease-in-out pt-9',
          sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'width',
        }}
      >
        {/* Pinned message at top */}
        <div className='relative flex flex-1 overflow-hidden'>
          <div className='flex flex-col flex-1'>
            {pinnedMessage && (
              <div className='mb-0'>
                <ChatMessages
                  loading={false}
                  groupedMessages={{ Pinned: [pinnedMessage] }}
                  userSummary={userSummary}
                  messagesEndRef={messagesEndRef}
                  messagesContainerRef={messagesContainerRef}
                  handleDeleteMessage={handleDeleteMessage}
                  handleEditMessage={handleEditMessage}
                  getColorFromUsername={getColorFromUsername}
                  userRoles={userRoles}
                  getRoleStyles={getRoleStyles}
                  editingMessageId={editingMessageId}
                  setEditingMessageId={setEditingMessageId}
                  editedMessage={editedMessage}
                  setEditedMessage={setEditedMessage}
                  inputRef={inputRef}
                  pinnedMessageId={pinnedMessageId}
                  handlePinMessage={handlePinMessage}
                  handleUnpinMessage={handleUnpinMessage}
                  isAdmin={userRoles[String(userSummary?.steamId)] === 'admin'}
                  onReply={handleReplyToMessage}
                  scrollToMessage={scrollToMessage}
                  onAddReaction={handleAddReaction}
                  onRemoveReaction={handleRemoveReaction}
                />
              </div>
            )}

            <ChatMessages
              loading={pagination.offset === 0 ? loading : false}
              groupedMessages={groupedMessages}
              userSummary={userSummary}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              handleDeleteMessage={handleDeleteMessage}
              handleEditMessage={handleEditMessage}
              getColorFromUsername={getColorFromUsername}
              userRoles={userRoles}
              getRoleStyles={getRoleStyles}
              editingMessageId={editingMessageId}
              setEditingMessageId={setEditingMessageId}
              editedMessage={editedMessage}
              setEditedMessage={setEditedMessage}
              inputRef={inputRef}
              pinnedMessageId={pinnedMessageId}
              handlePinMessage={handlePinMessage}
              handleUnpinMessage={handleUnpinMessage}
              isAdmin={userRoles[String(userSummary?.steamId)] === 'admin'}
              onReply={handleReplyToMessage}
              scrollToMessage={scrollToMessage}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />

            <ChatInput
              inputRef={inputRef}
              onSendMessage={msg => handleSendMessage(msg, replyToMessage?.id || null)}
              handleEditLastMessage={handleEditLastMessage}
              replyToMessage={replyToMessage}
              clearReplyToMessage={() => setReplyToMessage(null)}
              messagesEndRef={messagesEndRef}
            />
          </div>

          <ChatUserList />
        </div>
      </div>
    )
  }

  return <div />
}
