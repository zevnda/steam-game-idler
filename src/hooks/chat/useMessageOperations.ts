import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { UserSummary } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { addToast } from '@heroui/react'

import { useSupabase } from '@/components/contexts/SupabaseContext'

interface UseMessageOperationsParams {
  userSummary: UserSummary
  userRoles: { [key: string]: string }
  messages: ChatMessageType[]
  setMessages: Dispatch<SetStateAction<ChatMessageType[]>>
  setShouldScrollToBottom: Dispatch<SetStateAction<boolean>>
  pagination: { limit: number; offset: number }
}

export function useMessageOperations({
  userSummary,
  userRoles,
  messages,
  setMessages,
  setShouldScrollToBottom,
  pagination,
}: UseMessageOperationsParams): {
  handleSendMessage: (message: string) => Promise<void>
  handleDeleteMessage: (msgId: string, msgUserId: string) => Promise<string | null | void>
  handleEditMessage: (msgId: string, newContent: string) => Promise<void>
} {
  const { supabase } = useSupabase()

  const handleSendMessage = async (message: string): Promise<void> => {
    if (!message.trim()) return
    const steamId = userSummary?.steamId || crypto.randomUUID()

    // Upsert user to 'users' table before sending message
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id,username,avatar_url')
      .eq('user_id', steamId)
      .single()

    const currentUsername = userSummary?.personaName || 'Unknown'

    if (!existingUser) {
      // User does not exist, insert new
      await supabase.from('users').insert([
        {
          user_id: steamId,
          username: currentUsername,
          avatar_url: userSummary?.avatar || null,
          role: null,
        },
      ])
    } else if (
      !existingUser.username ||
      existingUser.username !== currentUsername ||
      existingUser.avatar_url !== (userSummary?.avatar || null)
    ) {
      // User exists but username or avatar is missing or changed, update
      await supabase
        .from('users')
        .update({
          username: currentUsername,
          avatar_url: userSummary?.avatar || null,
        })
        .eq('user_id', steamId)
    }

    const tempId = `temp-${Date.now()}`
    const tempMessage = {
      id: tempId,
      user_id: steamId,
      username: userSummary?.personaName || 'Unknown',
      message,
      created_at: new Date().toISOString(),
      avatar_url: userSummary?.avatar || undefined,
    }
    setMessages(prev => {
      // Add new message, then trim to latest pagination.limit messages
      const updated = [...prev, tempMessage]
      return updated.length > pagination.limit ? updated.slice(updated.length - pagination.limit) : updated
    })
    setShouldScrollToBottom(true)
    const payload = {
      user_id: steamId,
      username: userSummary?.personaName || 'Unknown',
      message,
      avatar_url: userSummary?.avatar || undefined,
    }
    const { error } = await supabase.from('messages').insert([payload])
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

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
    if (!error) {
      setMessages(current => current.filter(msg => msg.id !== msgId))
    }
  }

  const handleEditMessage = async (msgId: string, newContent: string): Promise<void> => {
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
    if (!newContent.trim()) {
      // If the new content is empty or whitespace, delete the message
      await handleDeleteMessage(msgId, msg.user_id)
      return
    }
    const { error } = await supabase.from('messages').update({ message: newContent }).eq('id', msgId)
    if (error) {
      addToast({ title: 'Error editing message', color: 'danger' })
    } else {
      setMessages(current => current.map(m => (m.id === msgId ? { ...m, message: newContent } : m)))
    }
  }

  return {
    handleSendMessage,
    handleDeleteMessage,
    handleEditMessage,
  }
}
