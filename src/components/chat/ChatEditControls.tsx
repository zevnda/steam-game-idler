import { cn, Textarea } from '@heroui/react'
import React from 'react'

interface ChatEditControlsProps {
  isEditing: boolean
  editedMessage: string
  setEditedMessage: (msg: string) => void
  onSave: () => void
  onCancel: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

const ChatEditControls: React.FC<ChatEditControlsProps> = ({
  isEditing,
  editedMessage,
  setEditedMessage,
  onSave,
  onCancel,
  textareaRef,
}) => {
  // Local ref for the actual textarea DOM node
  const innerTextareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  // Callback ref to get the actual textarea element
  const setTextareaNode = (node: HTMLTextAreaElement | null): void => {
    innerTextareaRef.current = node
    if (isEditing && node) {
      const len = node.value.length
      node.focus()
      node.setSelectionRange(len, len)
    }
    // Also update the parent ref if provided
    if (textareaRef && typeof textareaRef !== 'function') {
      textareaRef.current = node as HTMLTextAreaElement
    }
  }

  React.useEffect(() => {
    if (isEditing && innerTextareaRef.current) {
      const len = innerTextareaRef.current.value.length
      innerTextareaRef.current.focus()
      innerTextareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSave()
      }}
      className='flex flex-col gap-2'
    >
      <Textarea
        ref={setTextareaNode}
        value={editedMessage}
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
        onChange={e => setEditedMessage(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSave()
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
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default ChatEditControls
