import type { RefObject } from 'react'

import { useCallback, useState } from 'react'
import emojiData from '@emoji-mart/data'

export interface Emoji {
  id: string
  name: string
  native: string
  shortcodes: string
  keywords?: string[]
}

interface EmojiSkin {
  native: string
  unified: string
}

interface EmojiMartEmoji {
  id: string
  name: string
  keywords: string[]
  skins: EmojiSkin[]
}

interface EmojiMartData {
  emojis: Record<string, EmojiMartEmoji>
}

// Create a map for O(1) lookup of emoji shortcodes
const emojiMap = new Map<string, string>()
Object.values((emojiData as EmojiMartData).emojis).forEach(emoji => {
  emojiMap.set(emoji.id, emoji.skins[0].native)
})

export function useEmojiShortcodes(
  inputRef: RefObject<HTMLTextAreaElement>,
  currentMessage: string,
): {
  emojiStart: number | null
  emojiQuery: string
  emojiResults: Emoji[]
  emojiSelectedIdx: number
  setEmojiSelectedIdx: (idx: number) => void
  handleEmojiInputChange: (text: string, cursorPos: number, setMessage?: (msg: string) => void) => void
  handleEmojiSelect: (idx: number, setMessage: (msg: string) => void) => void
  setEmojiQuery: (query: string) => void
  setEmojiStart: (start: number | null) => void
} {
  const [emojiStart, setEmojiStart] = useState<number | null>(null)
  const [emojiQuery, setEmojiQuery] = useState('')
  const [emojiResults, setEmojiResults] = useState<Emoji[]>([])
  const [emojiSelectedIdx, setEmojiSelectedIdx] = useState(0)

  const handleEmojiInputChange = useCallback(
    (text: string, cursorPos: number, setMessage?: (msg: string) => void) => {
      // Check for complete emoji shortcode pattern :emoji:
      const beforeCursor = text.slice(0, cursorPos)
      const emojiPattern = /:([a-zA-Z0-9_+-]+):/g
      let match
      let lastMatch = null

      while ((match = emojiPattern.exec(beforeCursor)) !== null) {
        lastMatch = match
      }

      // If we found a complete emoji shortcode right before cursor
      if (lastMatch && lastMatch.index + lastMatch[0].length === cursorPos) {
        const shortcode = lastMatch[1]
        const emoji = emojiMap.get(shortcode)

        if (emoji && setMessage) {
          // Replace the shortcode with the actual emoji and add a space
          const beforeShortcode = text.slice(0, lastMatch.index)
          const afterShortcode = text.slice(cursorPos)
          const newMessage = beforeShortcode + emoji + ' ' + afterShortcode

          setMessage(newMessage)

          // Close the dropdown
          setEmojiStart(null)
          setEmojiQuery('')
          setEmojiResults([])

          // Set cursor position after the emoji and space
          setTimeout(() => {
            if (inputRef.current) {
              const newCursorPos = lastMatch.index + emoji.length + 1
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
              inputRef.current.focus()
            }
          }, 0)

          return
        }
      }

      // Find the last ':' before cursor for autocomplete
      const lastColonIdx = beforeCursor.lastIndexOf(':')

      if (lastColonIdx === -1) {
        setEmojiStart(null)
        setEmojiQuery('')
        setEmojiResults([])
        return
      }

      // Check if there's a space or start of string before the colon
      const charBeforeColon = lastColonIdx > 0 ? text[lastColonIdx - 1] : ' '
      if (charBeforeColon !== ' ' && lastColonIdx !== 0) {
        setEmojiStart(null)
        setEmojiQuery('')
        setEmojiResults([])
        return
      }

      const afterColon = beforeCursor.slice(lastColonIdx + 1)

      // If there's a space after the colon, cancel
      if (afterColon.includes(' ')) {
        setEmojiStart(null)
        setEmojiQuery('')
        setEmojiResults([])
        return
      }

      setEmojiStart(lastColonIdx)
      setEmojiQuery(afterColon)

      // Search emojis
      if (afterColon.length > 0) {
        const allEmojis: Emoji[] = []

        // Extract emojis from emoji-mart data
        Object.values((emojiData as EmojiMartData).emojis).forEach(emoji => {
          allEmojis.push({
            id: emoji.id,
            name: emoji.name,
            native: emoji.skins[0].native,
            shortcodes: emoji.id,
            keywords: emoji.keywords,
          })
        })

        const query = afterColon.toLowerCase()

        // Improved filtering: prioritize exact matches
        const filtered = allEmojis
          .map(emoji => {
            const idLower = emoji.id.toLowerCase()
            const nameLower = emoji.name.toLowerCase()

            // Calculate match score
            let score = 0

            // Exact match gets highest priority
            if (idLower === query) {
              score = 1000
            }
            // Starts with query
            else if (idLower.startsWith(query)) {
              score = 500
            }
            // Name starts with query
            else if (nameLower.startsWith(query)) {
              score = 400
            }
            // Contains query in id
            else if (idLower.includes(query)) {
              score = 200
            }
            // Contains query in name
            else if (nameLower.includes(query)) {
              score = 100
            }
            // Keyword match
            else if (emoji.keywords?.some(k => k.toLowerCase().startsWith(query))) {
              score = 50
            }

            return { emoji, score }
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map(item => item.emoji)

        setEmojiResults(filtered)
        setEmojiSelectedIdx(0)
      } else {
        setEmojiResults([])
      }
    },
    [inputRef],
  )

  const handleEmojiSelect = useCallback(
    (idx: number, setMessage: (msg: string) => void) => {
      if (!inputRef.current || emojiStart === null || emojiResults.length === 0) return

      const selectedEmoji = emojiResults[idx]
      const textarea = inputRef.current
      const cursorPos = textarea.selectionStart || currentMessage.length
      const beforeEmoji = currentMessage.slice(0, emojiStart)
      const afterEmoji = currentMessage.slice(cursorPos)

      const newMessage = beforeEmoji + selectedEmoji.native + ' ' + afterEmoji
      setMessage(newMessage)

      // Reset state
      setEmojiStart(null)
      setEmojiQuery('')
      setEmojiResults([])

      // Set cursor position after the inserted emoji and space
      setTimeout(() => {
        const newCursorPos = emojiStart + selectedEmoji.native.length + 1
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    },
    [inputRef, emojiStart, emojiResults, currentMessage],
  )

  return {
    emojiStart,
    emojiQuery,
    emojiResults,
    emojiSelectedIdx,
    setEmojiSelectedIdx,
    handleEmojiInputChange,
    handleEmojiSelect,
    setEmojiQuery,
    setEmojiStart,
  }
}
