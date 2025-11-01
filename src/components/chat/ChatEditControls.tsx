import type { ReactElement, RefObject } from 'react'

import { cn, Textarea } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'

import { logEvent } from '@/utils/tasks'

interface ChatEditControlsProps {
  isEditing: boolean
  editedMessage: string
  setEditedMessage: (msg: string) => void
  onSave: (msg: string) => void // <-- change signature
  onCancel: () => void
  textareaRef: RefObject<HTMLTextAreaElement>
}

export default function ChatEditControls({
  isEditing,
  editedMessage,
  setEditedMessage,
  onSave,
  onCancel,
  textareaRef,
}: ChatEditControlsProps): ReactElement {
  const innerTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [localEditedMessage, setLocalEditedMessage] = useState(editedMessage)

  // Sync local state when editedMessage prop changes
  useEffect(() => {
    setLocalEditedMessage(editedMessage)
  }, [editedMessage])

  // Callback ref to get the actual textarea element
  const setTextareaNode = (node: HTMLTextAreaElement | null): void => {
    try {
      innerTextareaRef.current = node
      // Also update the parent ref if provided
      if (textareaRef && typeof textareaRef !== 'function') {
        textareaRef.current = node as HTMLTextAreaElement
      }
    } catch (error) {
      console.error('Error in setTextareaNode:', error)
      logEvent(`[Error] in setTextareaNode: ${error}`)
    }
  }

  // Set cursor position only when editing starts
  useEffect(() => {
    try {
      if (isEditing && innerTextareaRef.current) {
        const len = innerTextareaRef.current.value.length
        innerTextareaRef.current.focus()
        innerTextareaRef.current.setSelectionRange(len, len)
      }
    } catch (error) {
      console.error('Error setting cursor position:', error)
      logEvent(`[Error] in setCursorPosition: ${error}`)
    }
  }, [isEditing])

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSave(localEditedMessage)
      }}
      className='flex flex-col gap-2'
    >
      <Textarea
        ref={setTextareaNode}
        value={localEditedMessage}
        className='min-w-[700px]'
        classNames={{
          inputWrapper: cn(
            'bg-input data-[hover=true]:!bg-inputhover rounded-md',
            'group-data-[focus-within=true]:!bg-inputhover',
            'group-data-[focus-visible=true]:ring-transparent',
            'group-data-[focus-visible=true]:ring-offset-transparent',
          ),
          input: ['!min-h-8 !text-content text-xs placeholder:text-xs placeholder:text-altwhite/50 pt-2'],
        }}
        minRows={1}
        maxRows={15}
        onChange={e => setLocalEditedMessage(e.target.value)}
        onBlur={() => setEditedMessage(localEditedMessage)}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            e.preventDefault()
            setLocalEditedMessage(editedMessage)
            onCancel()
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSave(localEditedMessage)
          }
        }}
        autoFocus
      />
      <div className='flex gap-2'>
        <button type='submit' className='text-dynamic hover:text-dynamic-hover rounded text-[10px] cursor-pointer'>
          Save
        </button>
        <button
          type='button'
          className='text-dynamic hover:text-dynamic-hover rounded text-[10px] cursor-pointer'
          onClick={() => {
            setLocalEditedMessage(editedMessage)
            onCancel()
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
