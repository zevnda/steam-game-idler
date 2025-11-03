import type { ChatMessageType } from '@/components/contexts/SupabaseContext'
import type { UserSummary } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { addToast } from '@heroui/react'

import { useSupabase } from '@/components/contexts/SupabaseContext'
import { logEvent } from '@/utils/tasks'

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
  handleSendMessage: (message: string, replyToId?: string | null) => Promise<void>
  handleDeleteMessage: (msgId: string, msgUserId: string) => Promise<string | null | void>
  handleEditMessage: (msgId: string, newContent: string) => Promise<void>
} {
  const { supabase, broadcastStopTyping } = useSupabase()

  const handleSendMessage = async (message: string, replyToId?: string | null): Promise<void> => {
    try {
      if (!message.trim()) return
      const steamId = userSummary?.steamId || crypto.randomUUID()

      // Broadcast stop typing when sending message
      broadcastStopTyping()

      // Upsert user to 'users' table before sending message
      const { data: existingUser, error: userFetchError } = await supabase
        .from('users')
        .select('user_id,username,avatar_url')
        .eq('user_id', steamId)
        .single()

      if (userFetchError && userFetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', userFetchError)
        logEvent(`[Error] in fetchUser (sendMessage): ${userFetchError.message}`)
      }

      const currentUsername = userSummary?.personaName || 'Unknown'

      if (!existingUser) {
        // User does not exist, insert new
        const { error: insertError } = await supabase.from('users').insert([
          {
            user_id: steamId,
            username: currentUsername,
            avatar_url: userSummary?.avatar || null,
            role: null,
          },
        ])
        if (insertError) {
          console.error('Error inserting user:', insertError)
          logEvent(`[Error] in insertUser (sendMessage): ${insertError.message}`)
        }
      } else if (
        !existingUser.username ||
        existingUser.username !== currentUsername ||
        existingUser.avatar_url !== (userSummary?.avatar || null)
      ) {
        // User exists but username or avatar is missing or changed, update
        const { error: updateError } = await supabase
          .from('users')
          .update({
            username: currentUsername,
            avatar_url: userSummary?.avatar || null,
          })
          .eq('user_id', steamId)
        if (updateError) {
          console.error('Error updating user:', updateError)
          logEvent(`[Error] in updateUser (sendMessage): ${updateError.message}`)
        }
      }

      // Fetch reply data BEFORE creating the optimistic message
      let replyToData: ChatMessageType | null = null
      if (replyToId) {
        try {
          const { data, error: replyError } = await supabase.from('messages').select('*').eq('id', replyToId).single()

          if (!replyError && data) {
            replyToData = data as ChatMessageType
          }
        } catch (error) {
          console.error('Error fetching reply data:', error)
          logEvent(`[Error] in fetching reply data: ${error}`)
        }
      }

      const tempId = `temp-${Date.now()}`
      const tempMessage: ChatMessageType = {
        id: tempId,
        user_id: steamId,
        username: userSummary?.personaName || 'Unknown',
        message,
        created_at: new Date().toISOString(),
        avatar_url: userSummary?.avatar || undefined,
        reply_to_id: replyToId || undefined,
        reply_to: replyToData || undefined,
      }

      setMessages(prev => {
        // Add new message, then trim to latest pagination.limit messages
        const updated = [...prev, tempMessage]
        return updated.length > pagination.limit ? updated.slice(updated.length - pagination.limit) : updated
      })

      setShouldScrollToBottom(true)

      const payload: Record<string, unknown> = {
        user_id: steamId,
        username: userSummary?.personaName || 'Unknown',
        message,
        avatar_url: userSummary?.avatar || undefined,
      }

      // Only include reply_to_id if it exists and is not null
      if (replyToId) {
        payload.reply_to_id = replyToId
      }

      const { error } = await supabase.from('messages').insert([payload])
      if (error) {
        console.error('Error sending message:', error)
        logEvent(`[Error] in sendMessage: ${error.message}`)
        setMessages(prev => prev.filter(m => m.id !== tempId))
        addToast({
          title: 'Failed to send message',
          description: error.message,
          color: 'danger',
        })
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error)
      logEvent(`[Error] in handleSendMessage: ${error}`)
      addToast({
        title: 'Failed to send message',
        color: 'danger',
      })
    }
  }

  const handleDeleteMessage = async (msgId: string, msgUserId: string): Promise<string | null | void> => {
    try {
      const steamId = userSummary?.steamId ?? ''
      const userRole = steamId ? userRoles[steamId] : 'user'
      const canDeleteAny = userRole === 'admin' || userRole === 'mod'
      if (msgUserId !== steamId && !canDeleteAny) {
        return addToast({
          title: 'You can only delete your own messages.',
          color: 'danger',
        })
      }

      // Find the message to check if it contains any Supabase storage images
      const message = messages.find(m => m.id === msgId)
      if (message?.message) {
        // Extract all Supabase storage URLs from the message
        const storageUrlRegex =
          /https:\/\/inbxfhxkrhwiybnephlq\.supabase\.co\/storage\/v1\/object\/public\/sgi-chat\/([^)\s]+)/g
        const matches = [...message.message.matchAll(storageUrlRegex)]

        // Delete each image from storage
        for (const match of matches) {
          const filename = match[1]
          try {
            const { error: storageError } = await supabase.storage.from('sgi-chat').remove([filename])
            if (storageError) {
              console.error('Error deleting image from storage:', storageError)
              logEvent(`[Error] in deleteImageFromStorage: ${storageError.message}`)
            }
          } catch (storageErr) {
            console.error('Error deleting image from storage:', storageErr)
            logEvent(`[Error] in deleteImageFromStorage: ${storageErr}`)
          }
        }
      }

      const { error } = await supabase.from('messages').delete().eq('id', msgId)
      if (error) {
        console.error('Error deleting message:', error)
        logEvent(`[Error] in deleteMessage: ${error.message}`)
        addToast({
          title: 'Failed to delete message',
          color: 'danger',
        })
      } else {
        setMessages(current => current.filter(msg => msg.id !== msgId))
      }
    } catch (error) {
      console.error('Error in handleDeleteMessage:', error)
      logEvent(`[Error] in handleDeleteMessage: ${error}`)
      addToast({
        title: 'Failed to delete message',
        color: 'danger',
      })
    }
  }

  const handleEditMessage = async (msgId: string, newContent: string): Promise<void> => {
    try {
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
        console.error('Error editing message:', error)
        logEvent(`[Error] in editMessage: ${error.message}`)
        addToast({ title: 'Error editing message', color: 'danger' })
      } else {
        setMessages(current => current.map(m => (m.id === msgId ? { ...m, message: newContent } : m)))
      }
    } catch (error) {
      console.error('Error in handleEditMessage:', error)
      logEvent(`[Error] in handleEditMessage: ${error}`)
      addToast({ title: 'Error editing message', color: 'danger' })
    }
  }

  return {
    handleSendMessage,
    handleDeleteMessage,
    handleEditMessage,
  }
}
