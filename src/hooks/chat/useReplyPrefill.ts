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
