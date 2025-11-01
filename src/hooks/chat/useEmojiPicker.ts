import type { RefObject } from 'react'

import { useState } from 'react'

import { logEvent } from '@/utils/tasks'

export function useEmojiPicker(
  inputRef: RefObject<HTMLTextAreaElement>,
  newMessage: string,
  setNewMessage: (msg: string) => void,
): {
  showEmojiPicker: boolean
  setShowEmojiPicker: (show: boolean) => void
  insertEmoji: (emoji: { native: string }) => void
} {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const insertEmoji = (emoji: { native: string }): void => {
    try {
      if (!inputRef.current) return
      const textarea = inputRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = newMessage.slice(0, start)
      const after = newMessage.slice(end)
      const updated = before + emoji.native + after
      setNewMessage(updated)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.native.length, start + emoji.native.length)
      }, 0)
      setShowEmojiPicker(false)
    } catch (error) {
      console.error('Error in insertEmoji:', error)
      logEvent(`[Error] in insertEmoji: ${error}`)
    }
  }

  return {
    showEmojiPicker,
    setShowEmojiPicker,
    insertEmoji,
  }
}
