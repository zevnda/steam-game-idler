import { useEffect } from 'react'

import { logEvent } from '@/utils/tasks'

export function useReplyPrefill(
  replyToMessage: { username: string; message: string } | null,
  inputRef: React.RefObject<HTMLTextAreaElement>,
  setNewMessage: (msg: string) => void,
): void {
  useEffect(() => {
    try {
      if (replyToMessage && inputRef.current) {
        let messageContent = replyToMessage.message
        if (messageContent.startsWith('> :arrow:')) {
          const parts = messageContent.split('\n\n')
          messageContent = parts.length > 1 ? parts[1] : ''
        } else {
          messageContent = messageContent.split('\n')[0]
        }

        // Check if the message contains an image URL
        const imageUrlRegex = /(https?:\/\/(?:[\w.-]+)\/(?:[\w\-./%]+)\.(?:jpg|jpeg|png|gif|webp|svg))(?![^\s])/gi
        const hasImage = imageUrlRegex.test(messageContent)

        // If the message contains an image, replace it with "CONTAINS ATTACHMENT"
        if (hasImage) {
          messageContent = messageContent.replace(imageUrlRegex, '').trim()
          // If there's still text content after removing the image, keep it
          // Otherwise, just use an image icon
          if (messageContent) {
            messageContent = `${messageContent} :attachment:`
          } else {
            messageContent = ':attachment:'
          }
        }

        const quoted = `> :arrow: @${replyToMessage.username} ${messageContent}\n\n`
        setNewMessage(quoted)
        setTimeout(() => {
          inputRef.current!.focus()
          inputRef.current!.setSelectionRange(quoted.length, quoted.length)
        }, 0)
      }
    } catch (error) {
      console.error('Error in useReplyPrefill:', error)
      logEvent(`[Error] in useReplyPrefill: ${error}`)
    }
  }, [replyToMessage, inputRef, setNewMessage])
}
