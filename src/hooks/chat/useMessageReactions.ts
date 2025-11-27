import type { Dispatch, SetStateAction } from 'react'

import { addToast } from '@heroui/react'
import { useCallback, useRef, useState } from 'react'

import { useSupabase } from '@/components/chat/SupabaseContext'
import { logEvent } from '@/utils/tasks'

export interface MessageReaction {
  emoji: string
  user_ids: string[]
  usernames: string[]
  count: number
}

export interface MessageReactions {
  [messageId: string]: MessageReaction[]
}

interface UseMessageReactionsParams {
  userSteamId: string
  username: string
}

export function useMessageReactions({ userSteamId, username }: UseMessageReactionsParams): {
  reactions: MessageReactions
  setReactions: Dispatch<SetStateAction<MessageReactions>>
  handleAddReaction: (messageId: string, emoji: string) => Promise<void>
  handleRemoveReaction: (messageId: string, emoji: string) => Promise<void>
  getUserReactions: (messageId: string) => string[]
} {
  const { supabase } = useSupabase()
  const [reactions, setReactions] = useState<MessageReactions>({})
  const reactionDebounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Get all reactions for a message
  const getMessageReactions = useCallback(
    (messageId: string): MessageReaction[] => {
      return reactions[messageId] || []
    },
    [reactions],
  )

  // Get reactions the current user has made on a message
  const getUserReactions = useCallback(
    (messageId: string): string[] => {
      const messageReactions = getMessageReactions(messageId)
      return messageReactions.filter(r => r.user_ids.includes(userSteamId)).map(r => r.emoji)
    },
    [getMessageReactions, userSteamId],
  )

  // Add a reaction to a message
  const handleAddReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      const key = `${messageId}-${emoji}`

      try {
        if (!userSteamId) {
          addToast({ title: 'You must be logged in to react', color: 'danger' })
          return
        }

        // Clear existing debounce for this message+emoji
        if (reactionDebounceRef.current.has(key)) {
          clearTimeout(reactionDebounceRef.current.get(key)!)
          reactionDebounceRef.current.delete(key)
        }

        // Optimistically update UI immediately
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
                      usernames: [...r.usernames, username],
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
                usernames: [username],
                count: 1,
              },
            ],
          }
        })

        // Debounce the actual database update (300ms)
        const timeout = setTimeout(async () => {
          try {
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
              // Revert optimistic update
              setReactions(prev => {
                const messageReactions = prev[messageId] || []
                return {
                  ...prev,
                  [messageId]: messageReactions
                    .map(r => {
                      if (r.emoji === emoji) {
                        const newUserIds = r.user_ids.filter(id => id !== userSteamId)
                        return newUserIds.length > 0 ? { ...r, user_ids: newUserIds, count: newUserIds.length } : null
                      }
                      return r
                    })
                    .filter(Boolean) as MessageReaction[],
                }
              })
              reactionDebounceRef.current.delete(key)
              return
            }

            const currentReactions = (message?.reactions as MessageReaction[]) || []
            const existingReaction = currentReactions.find(r => r.emoji === emoji)

            let updatedReactions: MessageReaction[]

            if (existingReaction) {
              // User already reacted with this emoji
              if (existingReaction.user_ids.includes(userSteamId)) {
                reactionDebounceRef.current.delete(key)
                return
              }

              // Add user to existing reaction
              updatedReactions = currentReactions.map(r =>
                r.emoji === emoji
                  ? {
                      ...r,
                      user_ids: [...r.user_ids, userSteamId],
                      usernames: [...(r.usernames || []), username],
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
                  usernames: [username],
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

            reactionDebounceRef.current.delete(key)
          } catch (error) {
            console.error('Error in debounced reaction update:', error)
            logEvent(`[Error] in debounced reaction update: ${error}`)
            addToast({ title: 'Failed to add reaction', color: 'danger' })
            // Revert optimistic update
            setReactions(prev => {
              const messageReactions = prev[messageId] || []
              return {
                ...prev,
                [messageId]: messageReactions
                  .map(r => {
                    if (r.emoji === emoji) {
                      const newUserIds = r.user_ids.filter(id => id !== userSteamId)
                      return newUserIds.length > 0 ? { ...r, user_ids: newUserIds, count: newUserIds.length } : null
                    }
                    return r
                  })
                  .filter(Boolean) as MessageReaction[],
              }
            })
            reactionDebounceRef.current.delete(key)
          }
        }, 300)

        reactionDebounceRef.current.set(key, timeout)
      } catch (error) {
        console.error('Error in handleAddReaction:', error)
        logEvent(`[Error] in handleAddReaction: ${error}`)
        addToast({ title: 'Failed to add reaction', color: 'danger' })
      }
    },
    [userSteamId, username, supabase, reactionDebounceRef],
  )

  // Remove a reaction from a message
  const handleRemoveReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
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
              .map(r => {
                if (r.emoji === emoji) {
                  const userIndex = r.user_ids.indexOf(userSteamId)
                  const newUserIds = r.user_ids.filter(id => id !== userSteamId)
                  const newUsernames = r.usernames.filter((_, idx) => idx !== userIndex)
                  return {
                    ...r,
                    user_ids: newUserIds,
                    usernames: newUsernames,
                    count: r.count - 1,
                  }
                }
                return r
              })
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
          .map(r => {
            if (r.emoji === emoji) {
              const userIndex = r.user_ids.indexOf(userSteamId)
              const newUserIds = r.user_ids.filter(id => id !== userSteamId)
              const newUsernames = (r.usernames || []).filter((_, idx) => idx !== userIndex)
              return {
                ...r,
                user_ids: newUserIds,
                usernames: newUsernames,
                count: r.count - 1,
              }
            }
            return r
          })
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
                        usernames: [...(r.usernames || []), username],
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
                  usernames: [username],
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
    },
    [userSteamId, supabase, username],
  )

  return {
    reactions,
    setReactions,
    handleAddReaction,
    handleRemoveReaction,
    getUserReactions,
  }
}
