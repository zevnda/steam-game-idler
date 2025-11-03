import type { RefObject } from 'react'

import { useCallback, useEffect } from 'react'

interface MarkdownFormat {
  prefix: string
  suffix: string
}

const MARKDOWN_FORMATS: Record<string, MarkdownFormat> = {
  bold: { prefix: '**', suffix: '**' },
  italic: { prefix: '_', suffix: '_' },
  strikethrough: { prefix: '~~', suffix: '~~' },
  code: { prefix: '`', suffix: '`' },
  codeblock: { prefix: '```\n', suffix: '\n```' },
  quote: { prefix: '> ', suffix: '' },
}

export function useMarkdownShortcuts(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChange: (value: string) => void,
): void {
  const applyMarkdownFormat = useCallback(
    (format: MarkdownFormat): void => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)

      // Special handling for quote format (line-based)
      if (format === MARKDOWN_FORMATS.quote) {
        const lines = selectedText.split('\n')

        // Check if all lines are already quoted
        const allQuoted = lines.every(line => line.startsWith('> '))

        if (allQuoted) {
          // Remove quotes
          const unquoted = lines.map(line => line.replace(/^> /, '')).join('\n')
          textarea.setSelectionRange(start, end)
          document.execCommand('insertText', false, unquoted)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start + unquoted.length)
          }, 0)
        } else {
          // Add quotes
          const quoted = lines.map(line => (line ? `> ${line}` : line)).join('\n')
          textarea.setSelectionRange(start, end)
          document.execCommand('insertText', false, quoted)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start + quoted.length)
          }, 0)
        }
        return
      }

      // If no text is selected, just insert the prefix and suffix with cursor in between
      if (start === end) {
        const insertion = format.prefix + format.suffix
        document.execCommand('insertText', false, insertion)

        // Set cursor position between prefix and suffix
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + format.prefix.length, start + format.prefix.length)
        }, 0)
        return
      }

      // Check if selected text is already wrapped with this format
      const before = value.substring(0, start)
      const after = value.substring(end)
      const prefixBefore = before.slice(-format.prefix.length)
      const suffixAfter = after.slice(0, format.suffix.length)

      if (prefixBefore === format.prefix && suffixAfter === format.suffix) {
        // Remove the formatting
        // Select the prefix, suffix, and content
        textarea.setSelectionRange(start - format.prefix.length, end + format.suffix.length)
        document.execCommand('insertText', false, selectedText)

        // Restore selection without the formatting markers
        setTimeout(() => {
          textarea.focus()
          const newStart = start - format.prefix.length
          const newEnd = newStart + selectedText.length
          textarea.setSelectionRange(newStart, newEnd)
        }, 0)
      } else {
        // Add the formatting
        const wrapped = format.prefix + selectedText + format.suffix
        textarea.setSelectionRange(start, end)
        document.execCommand('insertText', false, wrapped)

        // Restore selection including the formatting markers
        setTimeout(() => {
          textarea.focus()
          const newStart = start + format.prefix.length
          const newEnd = newStart + selectedText.length
          textarea.setSelectionRange(newStart, newEnd)
        }, 0)
      }
    },
    [textareaRef, value],
  )

  const formatAsLink = useCallback(
    (url: string): void => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)

      if (selectedText && start !== end) {
        // Format as markdown link
        const link = `[${selectedText}](${url})`
        textarea.setSelectionRange(start, end)
        document.execCommand('insertText', false, link)

        setTimeout(() => {
          textarea.focus()
          const newPos = start + selectedText.length + url.length + 4
          textarea.setSelectionRange(newPos, newPos)
        }, 0)
      } else {
        // Just insert the URL
        document.execCommand('insertText', false, url)

        setTimeout(() => {
          textarea.focus()
          const newPos = start + url.length
          textarea.setSelectionRange(newPos, newPos)
        }, 0)
      }
    },
    [textareaRef, value],
  )

  const toggleListFormat = useCallback(
    (listType: 'unordered' | 'ordered'): void => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)
      const lines = selectedText.split('\n')

      const unorderedRegex = /^[*\-+] /
      const orderedRegex = /^\d+\. /

      // Check if all lines are already formatted
      const allFormatted = lines.every(line =>
        listType === 'unordered' ? unorderedRegex.test(line) : orderedRegex.test(line),
      )

      if (allFormatted) {
        // Remove list formatting
        const unformatted = lines.map(line => line.replace(unorderedRegex, '').replace(orderedRegex, '')).join('\n')
        textarea.setSelectionRange(start, end)
        document.execCommand('insertText', false, unformatted)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start, start + unformatted.length)
        }, 0)
      } else {
        // Add list formatting
        const formatted = lines
          .map((line, index) => {
            if (!line) return line
            // Remove existing list formatting first
            const cleaned = line.replace(unorderedRegex, '').replace(orderedRegex, '')
            return listType === 'unordered' ? `- ${cleaned}` : `${index + 1}. ${cleaned}`
          })
          .join('\n')
        textarea.setSelectionRange(start, end)
        document.execCommand('insertText', false, formatted)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start, start + formatted.length)
        }, 0)
      }
    },
    [textareaRef, value],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handlePaste = (e: ClipboardEvent): void => {
      const clipboardData = e.clipboardData
      if (!clipboardData) return

      const pastedText = clipboardData.getData('text')

      // Check if pasted text is a URL
      const urlRegex = /^https?:\/\/.+/
      if (urlRegex.test(pastedText.trim())) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        // If there's selected text, format as markdown link
        if (start !== end) {
          e.preventDefault()
          formatAsLink(pastedText.trim())
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Check for Ctrl/Cmd + key combinations
      if (!(e.ctrlKey || e.metaKey)) return

      let format: MarkdownFormat | null = null

      // Handle Ctrl+Shift combinations first
      if (e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'e':
            format = MARKDOWN_FORMATS.codeblock
            break
          case '.':
            format = MARKDOWN_FORMATS.quote
            break
          case '8':
            e.preventDefault()
            e.stopPropagation()
            toggleListFormat('unordered')
            return
          case '7':
            e.preventDefault()
            e.stopPropagation()
            toggleListFormat('ordered')
            return
          default:
            return
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'b':
            format = MARKDOWN_FORMATS.bold
            break
          case 'i':
            format = MARKDOWN_FORMATS.italic
            break
          case 'd':
            format = MARKDOWN_FORMATS.strikethrough
            break
          case 'e':
            format = MARKDOWN_FORMATS.code
            break
          default:
            return
        }
      }

      if (format) {
        e.preventDefault()
        e.stopPropagation()
        applyMarkdownFormat(format)
      }
    }

    textarea.addEventListener('keydown', handleKeyDown)
    textarea.addEventListener('paste', handlePaste)
    return () => {
      textarea.removeEventListener('keydown', handleKeyDown)
      textarea.removeEventListener('paste', handlePaste)
    }
  }, [textareaRef, applyMarkdownFormat, formatAsLink, toggleListFormat])
}
