'use client'

import type { UserSummary } from '@/types'
import type { FormEvent, ReactElement } from 'react'
import type { Message } from './ChatMessages'

import { addToast, cn } from '@heroui/react'
import React, { useEffect, useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import ChatMessages from './ChatMessages'
import { createClient } from '@supabase/supabase-js'

import { useStateContext } from '@/components/contexts/StateContext'

// Initialize Supabase client
const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

interface NewMessagePayload {
  user_id: string
  username: string
  message: string
  avatar_url?: string
}

export default function ChatBox(): ReactElement {
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const { sidebarCollapsed, transitionDuration } = useStateContext()

  const [motd, setMotd] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [userRoles, setUserRoles] = useState<{ [steamId: string]: string }>({})
  const [pagination, setPagination] = useState({ limit: 50, offset: 0 })

  const messagesEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const messagesContainerRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const inputRef = useRef<HTMLTextAreaElement>(null as unknown as HTMLTextAreaElement)

  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
  const username = userSummary?.personaName || 'Unknown'

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = async (): Promise<void> => {
      if (container.scrollTop === 0 && hasMore && !loading) {
        // Record scroll height before fetching
        const prevScrollHeight = container.scrollHeight
        // Fetch older messages
        const newOffset = pagination.offset + pagination.limit
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .range(newOffset, newOffset + pagination.limit - 1)
        if (!error && data && data.length > 0) {
          // Reverse to ascending order for display
          const olderMessages = data.reverse()
          setMessages(current => {
            // Avoid duplicates: filter out messages already present
            const currentIds = new Set(current.map(m => m.id))
            const uniqueOlder = olderMessages.filter(m => !currentIds.has(m.id))
            return [...uniqueOlder, ...current]
          })
          setPagination(prev => ({ ...prev, offset: newOffset }))
          setHasMore(data.length === pagination.limit)
          // Wait for DOM update, then restore scroll position
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - prevScrollHeight
          }, 0)
          setShouldScrollToBottom(false)
        }
      }
    }
    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [hasMore, loading, pagination])

  // Edit message handler
  const handleEditMessage = async (msgId: string, newContent: string): Promise<void> => {
    // Find message
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return
    const steamId = userSummary?.steamId ?? ''
    const userRole = steamId ? userRoles[steamId] : 'user'
    const canEditAny = userRole === 'admin' || userRole === 'mod'
    if (msg.user_id !== steamId && !canEditAny) {
      addToast({
        title: 'You can only edit your own messages.',
        color: 'danger',
      })
      return
    }
    const { error } = await supabase.from('messages').update({ message: newContent }).eq('id', msgId)
    if (error) {
      console.error('Error editing message:', error)
      addToast({ title: 'Error editing message', color: 'danger' })
    } else {
      setMessages(current => current.map(m => (m.id === msgId ? { ...m, message: newContent } : m)))
    }
  }

  // Handler to start editing last message from input
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessage, setEditedMessage] = useState('')
  const handleEditLastMessage = (): void => {
    const steamId = userSummary?.steamId ?? ''
    // Find last message sent by this user
    const lastMsg = [...messages].reverse().find(m => m.user_id === steamId)
    if (lastMsg) {
      setEditingMessageId(lastMsg.id)
      setEditedMessage(lastMsg.message)
    }
  }

  // Focus ChatInput Textarea after editing is cancelled
  useEffect(() => {
    if (editingMessageId === null) {
      inputRef.current?.focus()
    }
  }, [editingMessageId])

  useEffect(() => {
    // Fetch all user roles from chat_users table
    const fetchUserRoles = async (): Promise<void> => {
      const { data, error } = await supabase.from('users').select('user_id,role')
      if (!error && data) {
        // Map user_id to role
        const roles: { [userId: string]: string } = {}
        data.forEach((user: { user_id: string; role: string }) => {
          roles[user.user_id] = user.role
        })
        setUserRoles(roles)
      }
    }
    fetchUserRoles()
  }, [])

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return '#e91e63'
      case 'mod':
        return '#43b581'
      case 'early_supporter':
        return '#a1d8f8ff'
      default:
        return '#dbdee1'
    }
  }
  // Auto-scroll to bottom
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  // Scroll to bottom only if shouldScrollToBottom is true
  useEffect(() => {
    if (!loading && messages.length > 0 && shouldScrollToBottom) {
      scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [loading, messages, shouldScrollToBottom])

  useEffect(() => {
    // Fetch MOTD from chat_settings table
    const fetchMotd = async (): Promise<void> => {
      const { data, error } = await supabase.from('chat_settings').select('motd').maybeSingle()
      if (!error && data?.motd) setMotd(data.motd)
    }
    fetchMotd()
  }, [])

  // Load initial messages and subscribe to new ones
  useEffect(() => {
    // Fetch latest messages with pagination
    const fetchMessages = async (): Promise<void> => {
      setLoading(true)
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1)

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        // Reverse to ascending order for display
        const newMessages = (data || []).reverse()
        setMessages(current => {
          // On first load, overwrite. On pagination, append older messages.
          if (pagination.offset === 0) {
            setShouldScrollToBottom(true)
            return newMessages
          } else {
            const currentIds = new Set(current.map(m => m.id))
            const uniqueOlder = newMessages.filter(m => !currentIds.has(m.id))
            return [...uniqueOlder, ...current]
          }
        })
        setHasMore((count ?? 0) > pagination.offset + pagination.limit)
      }
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to new, updated, and deleted messages
    const channel = supabase
      .channel('messages')
      // New message
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new as Message
        const isOwnMessage = newMsg.user_id === (userSummary?.steamId || '')
        const container = messagesContainerRef.current
        if (container && !isOwnMessage) {
          const threshold = 100
          const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
          setMessages(current => [...current, newMsg])
          if (isAtBottom) {
            setShouldScrollToBottom(true)
          }
        } else {
          setMessages(current => [...current, newMsg])
        }
      })

      // Edited message
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const updatedMsg = payload.new as Message
        setMessages(current => current.map(m => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)))
      })

      // Deleted message
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        const deletedMsg = payload.old as Message
        setMessages(current => current.filter(m => m.id !== deletedMsg.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userSummary?.steamId, pagination])

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    if (!newMessage.trim()) return

    const payload: NewMessagePayload = {
      user_id: userSummary?.steamId || crypto.randomUUID(),
      username,
      message: newMessage, // <-- do NOT trim, preserve newlines
      avatar_url: userSummary?.avatar || undefined,
    }

    const { error } = await supabase.from('messages').insert([payload])

    if (error) {
      console.error('Error sending message:', error)
    } else {
      setNewMessage('')
      setShouldScrollToBottom(true)
    }
  }

  // Delete message handler
  const handleDeleteMessage = async (msgId: string, msgUserId: string): Promise<string | null | void> => {
    const steamId = userSummary?.steamId ?? ''
    const userRole = steamId ? userRoles[steamId] : 'user'
    const canDeleteAny = userRole === 'admin' || userRole === 'mod'
    if (msgUserId !== steamId && !canDeleteAny) {
      return addToast({
        title: 'You can only delete your own messages.',
        color: 'danger',
      })
    }

    const { error } = await supabase.from('messages').delete().eq('id', msgId)

    if (error) {
      console.error('Error deleting message:', error)
    } else {
      setMessages(current => current.filter(msg => msg.id !== msgId))
    }
  }

  // Generate color from username
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

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]): { [key: string]: Message[] } => {
    const groups: { [key: string]: Message[] } = {}
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }
  const groupedMessages = groupMessagesByDate(messages)

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
      />
      <ChatInput
        inputRef={inputRef}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleEditLastMessage={handleEditLastMessage}
      />
    </div>
  )
}
