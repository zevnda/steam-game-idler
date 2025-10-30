'use client'

import type { UserSummary } from '@/types'
import type { ReactElement } from 'react'
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
  const { sidebarCollapsed, transitionDuration } = useStateContext()
  const [motd, setMotd] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
  const username = userSummary?.personaName || 'Unknown'
  const messagesContainerRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const [userRoles, setUserRoles] = useState<{ [steamId: string]: string }>({})

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
      default:
        return '#dbdee1'
    }
  }
  // Auto-scroll to bottom
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  // Scroll to bottom after initial load (when loading becomes false)
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom()
    }
  }, [loading, messages])

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
    // Fetch existing messages
    const fetchMessages = async (): Promise<void> => {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data || [])
        // Force scroll to bottom after initial load
        setTimeout(() => {
          scrollToBottom()
        }, 0)
      }
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(current => [...current, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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
        loading={loading}
        groupedMessages={groupedMessages}
        userSummary={userSummary}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        handleDeleteMessage={handleDeleteMessage}
        handleEditMessage={handleEditMessage}
        getColorFromUsername={getColorFromUsername}
        userRoles={userRoles}
        getRoleColor={getRoleColor}
      />
      <ChatInput newMessage={newMessage} setNewMessage={setNewMessage} handleSendMessage={handleSendMessage} />
    </div>
  )
}
