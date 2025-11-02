import type { Dispatch, SetStateAction } from 'react'

import { addToast } from '@heroui/react'
import { useState } from 'react'

import { useSupabase } from '@/components/contexts/SupabaseContext'
import { logEvent } from '@/utils/tasks'

export interface MessageReaction {
  emoji: string
  user_ids: string[]
  count: number
}

export interface MessageReactions {
  [messageId: string]: MessageReaction[]
}

interface UseMessageReactionsParams {
  userSteamId: string
}

export function useMessageReactions({ userSteamId }: UseMessageReactionsParams): {
  reactions: MessageReactions
  setReactions: Dispatch<SetStateAction<MessageReactions>>
  handleAddReaction: (messageId: string, emoji: string) => Promise<void>
  handleRemoveReaction: (messageId: string, emoji: string) => Promise<void>
  getUserReactions: (messageId: string) => string[]
} {
  const { supabase } = useSupabase()
  const [reactions, setReactions] = useState<MessageReactions>({})

  // Get all reactions for a message
  const getMessageReactions = (messageId: string): MessageReaction[] => {
    return reactions[messageId] || []
  }

  // Get reactions the current user has made on a message
  const getUserReactions = (messageId: string): string[] => {
    const messageReactions = getMessageReactions(messageId)
    return messageReactions.filter(r => r.user_ids.includes(userSteamId)).map(r => r.emoji)
  }

  // Add a reaction to a message
  const handleAddReaction = async (messageId: string, emoji: string): Promise<void> => {
    try {
      if (!userSteamId) {
        addToast({ title: 'You must be logged in to react', color: 'danger' })
        return
      }

      // Optimistically update UI
      setReactions(prev => {
        const messageReactions = prev[messageId] || []
        const existingReaction = messageReactions.find(r => r.emoji === emoji)

        if (existingReaction) {
          // User already reacted with this emoji, don't add again
          if (existingReaction.user_ids.includes(userSteamId)) {
            return prev
          }

          // Add user to existing reaction
          return {
            ...prev,
            [messageId]: messageReactions.map(r =>
              r.emoji === emoji
                ? {
                    ...r,
                    user_ids: [...r.user_ids, userSteamId],
                    count: r.count + 1,
                  }
                : r,
            ),
          }
        }

        // Create new reaction
        return {
          ...prev,
          [messageId]: [
            ...messageReactions,
            {
              emoji,
              user_ids: [userSteamId],
              count: 1,
            },
          ],
        }
      })

      // Fetch current reactions from database
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single()

      if (fetchError) {
        console.error('Error fetching message reactions:', fetchError)
        logEvent(`[Error] in fetchMessageReactions: ${fetchError.message}`)
        addToast({ title: 'Failed to add reaction', color: 'danger' })
        return
      }

      const currentReactions = (message?.reactions as MessageReaction[]) || []
      const existingReaction = currentReactions.find(r => r.emoji === emoji)

      let updatedReactions: MessageReaction[]

      if (existingReaction) {
        // User already reacted with this emoji
        if (existingReaction.user_ids.includes(userSteamId)) {
          return
        }

        // Add user to existing reaction
        updatedReactions = currentReactions.map(r =>
          r.emoji === emoji
            ? {
                ...r,
                user_ids: [...r.user_ids, userSteamId],
                count: r.count + 1,
              }
            : r,
        )
      } else {
        // Create new reaction
        updatedReactions = [
          ...currentReactions,
          {
            emoji,
            user_ids: [userSteamId],
            count: 1,
          },
        ]
      }

      // Update database
      const { error: updateError } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId)

      if (updateError) {
        console.error('Error updating message reactions:', updateError)
        logEvent(`[Error] in updateMessageReactions: ${updateError.message}`)
        addToast({ title: 'Failed to add reaction', color: 'danger' })

        // Revert optimistic update
        setReactions(prev => {
          const messageReactions = prev[messageId] || []
          return {
            ...prev,
            [messageId]: messageReactions
              .map(r =>
                r.emoji === emoji
                  ? {
                      ...r,
                      user_ids: r.user_ids.filter(id => id !== userSteamId),
                      count: r.count - 1,
                    }
                  : r,
              )
              .filter(r => r.count > 0),
          }
        })
      }
    } catch (error) {
      console.error('Error in handleAddReaction:', error)
      logEvent(`[Error] in handleAddReaction: ${error}`)
      addToast({ title: 'Failed to add reaction', color: 'danger' })
    }
  }

  // Remove a reaction from a message
  const handleRemoveReaction = async (messageId: string, emoji: string): Promise<void> => {
    try {
      if (!userSteamId) {
        addToast({ title: 'You must be logged in to remove reactions', color: 'danger' })
        return
      }

      // Optimistically update UI
      setReactions(prev => {
        const messageReactions = prev[messageId] || []
        return {
          ...prev,
          [messageId]: messageReactions
            .map(r =>
              r.emoji === emoji
                ? {
                    ...r,
                    user_ids: r.user_ids.filter(id => id !== userSteamId),
                    count: r.count - 1,
                  }
                : r,
            )
            .filter(r => r.count > 0),
        }
      })

      // Fetch current reactions from database
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single()

      if (fetchError) {
        console.error('Error fetching message reactions:', fetchError)
        logEvent(`[Error] in fetchMessageReactions: ${fetchError.message}`)
        addToast({ title: 'Failed to remove reaction', color: 'danger' })
        return
      }

      const currentReactions = (message?.reactions as MessageReaction[]) || []
      const updatedReactions = currentReactions
        .map(r =>
          r.emoji === emoji
            ? {
                ...r,
                user_ids: r.user_ids.filter(id => id !== userSteamId),
                count: r.count - 1,
              }
            : r,
        )
        .filter(r => r.count > 0)

      // Update database
      const { error: updateError } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId)

      if (updateError) {
        console.error('Error removing message reaction:', updateError)
        logEvent(`[Error] in removeMessageReaction: ${updateError.message}`)
        addToast({ title: 'Failed to remove reaction', color: 'danger' })

        // Revert optimistic update
        setReactions(prev => {
          const messageReactions = prev[messageId] || []
          const existingReaction = messageReactions.find(r => r.emoji === emoji)

          if (existingReaction) {
            return {
              ...prev,
              [messageId]: messageReactions.map(r =>
                r.emoji === emoji
                  ? {
                      ...r,
                      user_ids: [...r.user_ids, userSteamId],
                      count: r.count + 1,
                    }
                  : r,
              ),
            }
          }

          return {
            ...prev,
            [messageId]: [
              ...messageReactions,
              {
                emoji,
                user_ids: [userSteamId],
                count: 1,
              },
            ],
          }
        })
      }
    } catch (error) {
      console.error('Error in handleRemoveReaction:', error)
      logEvent(`[Error] in handleRemoveReaction: ${error}`)
      addToast({ title: 'Failed to remove reaction', color: 'danger' })
    }
  }

  return {
    reactions,
    setReactions,
    handleAddReaction,
    handleRemoveReaction,
    getUserReactions,
  }
}
