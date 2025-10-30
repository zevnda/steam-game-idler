import type { FormEvent, ReactElement, RefObject } from 'react'

import { Button, cn, Textarea } from '@heroui/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { IoSend } from 'react-icons/io5'

import ExtLink from '@/components/ui/ExtLink'

interface ChatInputProps {
  inputRef: RefObject<HTMLTextAreaElement>
  newMessage: string
  setNewMessage: (msg: string) => void
  handleSendMessage: (e: FormEvent<HTMLFormElement>) => void
  handleEditLastMessage: () => void
}

export default function ChatInput({
  inputRef,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleEditLastMessage,
}: ChatInputProps): ReactElement {
  const { t } = useTranslation()
  return (
    <div className='p-2 pt-0'>
      <p className='text-[10px] py-1'>
        GitHub Flavored Markdown is supported.{' '}
        <ExtLink
          className='text-dynamic hover:text-dynamic-hover duration-150'
          href='https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax'
        >
          Learn more
        </ExtLink>
      </p>

      <form onSubmit={handleSendMessage}>
        <Textarea
          ref={inputRef}
          size='sm'
          placeholder={t('chat.inputPlaceholder')}
          className='w-full mb-0 pb-0 resize-y'
          classNames={{
            inputWrapper: cn(
              'bg-input data-[hover=true]:!bg-inputhover rounded-md',
              'group-data-[focus-within=true]:!bg-inputhover',
              'group-data-[focus-visible=true]:ring-transparent',
              'group-data-[focus-visible=true]:ring-offset-transparent',
            ),
            input: ['!min-h-8 !text-content text-xs placeholder:text-xs placeholder:text-altwhite/50 pt-2'],
          }}
          endContent={
            <Button
              size='sm'
              isIconOnly
              isDisabled={!newMessage.trim()}
              startContent={<IoSend size={16} />}
              type='submit'
              className={cn(
                'bg-transparent hover:bg-white/10 hover:text-dynamic/80 transition-colors',
                newMessage.trim() ? 'text-dynamic' : 'text-white/10',
              )}
            />
          }
          minRows={1}
          maxRows={15}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowUp' && !newMessage) {
              e.preventDefault()
              handleEditLastMessage()
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage(undefined as unknown as FormEvent<HTMLFormElement>)
            }
            // SHIFT+ENTER is default (new line)
          }}
          autoFocus
        />
      </form>
    </div>
  )
}
