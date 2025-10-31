import type { ChatMessageType } from '@/hooks/chat/useMessages'
import type { UserSummary } from '@/types'
import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useRef } from 'react'
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import ChatMessages from './ChatMessages'

import ChatMaintenance from '@/components/chat/ChatMaintenance'
import { usePinnedMessage } from '@/components/chat/usePinnedMessage'
import { useStateContext } from '@/components/contexts/StateContext'
import { useChatMaintenanceMode } from '@/hooks/chat/useChatMaintenanceMode'
import { useMessages } from '@/hooks/chat/useMessages'
import { useMotd } from '@/hooks/chat/useMotd'
import { useUserRoles } from '@/hooks/chat/useUserRoles'

export default function ChatBox(): ReactElement {
  const { sidebarCollapsed, transitionDuration } = useStateContext()
  const messagesEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const messagesContainerRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const inputRef = useRef<HTMLTextAreaElement>(null as unknown as HTMLTextAreaElement)
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

  const chatMaintenanceMode = useChatMaintenanceMode()
  const { userRoles } = useUserRoles()
  const { pinnedMessageId, pinnedMessage, handlePinMessage, handleUnpinMessage, setPinnedMessage } =
    usePinnedMessage() as {
      pinnedMessageId: string | null
      pinnedMessage: ChatMessageType | null
      handlePinMessage: (message: ChatMessageType) => void
      handleUnpinMessage: () => void
      setPinnedMessage: React.Dispatch<React.SetStateAction<ChatMessageType | null>>
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
  } = useMessages({
    userSummary,
    userRoles,
    messagesEndRef,
    messagesContainerRef,
    inputRef,
    pinnedMessageId,
    setPinnedMessage,
  })
  const motd = useMotd()

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return '#e91e63'
      case 'mod':
        return '#1eb6e9ff'
      case 'early_supporter':
        return '#43b581'
      default:
        return '#dbdee1'
    }
  }

  const getColorFromUsername = (name: string): string => {
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
  }

  const groupedMessages = groupMessagesByDate(messages)

  if (chatMaintenanceMode) {
    return (
      <div
        className={cn(
          'flex flex-col h-screen ease-in-out',
          sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'width',
        }}
      >
        <ChatHeader motd={motd} />
        <ChatMaintenance />
      </div>
    )
  }

  if (!chatMaintenanceMode) {
    return (
      <div
        className={cn(
          'flex flex-col h-screen ease-in-out',
          sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'width',
        }}
      >
        <ChatHeader motd={motd} />
        {/* Pinned message at top */}
        {pinnedMessage && (
          <div className='mb-2 border-b border-border'>
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
              getRoleColor={getRoleColor}
              editingMessageId={editingMessageId}
              setEditingMessageId={setEditingMessageId}
              editedMessage={editedMessage}
              setEditedMessage={setEditedMessage}
              inputRef={inputRef}
              pinnedMessageId={pinnedMessageId}
              handlePinMessage={handlePinMessage}
              handleUnpinMessage={handleUnpinMessage}
              isAdmin={userRoles[String(userSummary?.steamId)] === 'admin'}
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
          getRoleColor={getRoleColor}
          editingMessageId={editingMessageId}
          setEditingMessageId={setEditingMessageId}
          editedMessage={editedMessage}
          setEditedMessage={setEditedMessage}
          inputRef={inputRef}
          pinnedMessageId={pinnedMessageId}
          handlePinMessage={handlePinMessage}
          handleUnpinMessage={handleUnpinMessage}
          isAdmin={userRoles[String(userSummary?.steamId)] === 'admin'}
        />

        <ChatInput
          inputRef={inputRef}
          onSendMessage={handleSendMessage}
          handleEditLastMessage={handleEditLastMessage}
        />
      </div>
    )
  }

  return <div />
}
