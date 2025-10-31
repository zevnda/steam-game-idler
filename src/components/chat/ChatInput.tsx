import type { ReactElement, RefObject } from 'react'

import { Button, cn, Textarea } from '@heroui/react'
import { useState } from 'react'
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { IoSend } from 'react-icons/io5'

import { useUserContext } from '@/components/contexts/UserContext'
import ExtLink from '@/components/ui/ExtLink'
import { useEmojiPicker } from '@/hooks/chat/useEmojiPicker'
import { useMentionUsers } from '@/hooks/chat/useMentionUsers'
import { useReplyPrefill } from '@/hooks/chat/useReplyPrefill'
import { useTypingUsers } from '@/hooks/chat/useTypingUsers'

interface ChatInputProps {
  inputRef: RefObject<HTMLTextAreaElement>
  onSendMessage: (msg: string) => void
  handleEditLastMessage: () => void
  replyToMessage?: { username: string; message: string } | null // Add this
  clearReplyToMessage?: () => void // Add this
}

export default function ChatInput({
  inputRef,
  onSendMessage,
  handleEditLastMessage,
  replyToMessage,
  clearReplyToMessage,
}: ChatInputProps): ReactElement {
  const [newMessage, setNewMessage] = useState('')
  const { t } = useTranslation()
  const { userSummary } = useUserContext()

  const currentUser = {
    user_id: userSummary?.steamId ?? '',
    username: userSummary?.personaName ?? '',
  }
  const { typingUsers, broadcastTyping, broadcastStopTyping } = useTypingUsers(currentUser)

  const {
    mentionStart,
    mentionResults,
    mentionSelectedIdx,
    setMentionSelectedIdx,
    handleInputChange: handleMentionInputChange,
    handleMentionSelect,
    setMentionQuery,
    setMentionStart,
    setMentionResults,
  } = useMentionUsers(inputRef, newMessage)

  const { showEmojiPicker, setShowEmojiPicker, insertEmoji } = useEmojiPicker(inputRef, newMessage, setNewMessage)

  useReplyPrefill(replyToMessage ?? null, inputRef, setNewMessage)

  // Broadcast stop_typing on submit
  const handleSend = (): void => {
    broadcastStopTyping()
  }

  return (
    <div className='p-2 pt-0'>
      <div className='flex justify-between items-end w-full'>
        {/* Typing indicator */}
        {typingUsers.filter(u => u.user_id !== currentUser.user_id).length > 0 ? (
          <p className='text-[10px] py-1'>
            {typingUsers
              .filter(u => u.user_id !== currentUser.user_id)
              .map(u => u.username)
              .join(', ')}
            <span className='font-thin'>
              {typingUsers.filter(u => u.user_id !== currentUser.user_id).length === 1
                ? ' is typing...'
                : ' are typing'}
            </span>
          </p>
        ) : (
          <span />
        )}

        <p className='text-[10px] py-1'>
          GitHub Flavored Markdown is supported.{' '}
          <ExtLink
            className='text-dynamic hover:text-dynamic-hover duration-150'
            href='https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax'
          >
            Learn more
          </ExtLink>
        </p>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault()
          if (newMessage.trim()) {
            handleSend()
            onSendMessage(newMessage)
            setNewMessage('')
            setMentionQuery('')
            setMentionStart(null)
            if (clearReplyToMessage) clearReplyToMessage()
          }
        }}
      >
        <div style={{ position: 'relative' }}>
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
              <div className='relative flex justify-center items-center'>
                {/* Emoji picker button */}
                <Button
                  isIconOnly
                  size='sm'
                  className='bg-transparent hover:bg-white/10 text-md'
                  type='button'
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                  aria-label='Insert emoji'
                >
                  😊
                </Button>

                {showEmojiPicker && (
                  <div className='absolute -right-2 bottom-9 mb-2 z-50'>
                    <Picker
                      data={emojiData}
                      onEmojiSelect={insertEmoji}
                      theme='dark'
                      previewPosition='none'
                      perLine={8}
                      navPosition='top'
                    />
                  </div>
                )}

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
              </div>
            }
            minRows={1}
            maxRows={15}
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value)
              const textarea = e.target as unknown as HTMLTextAreaElement
              handleMentionInputChange(e.target.value, textarea.selectionStart || e.target.value.length)
              broadcastTyping()
            }}
            onKeyDown={e => {
              // Mention navigation
              if (mentionResults.length > 0 && mentionStart !== null) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setMentionSelectedIdx(Math.min(mentionSelectedIdx + 1, mentionResults.length - 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setMentionSelectedIdx(Math.max(mentionSelectedIdx - 1, 0))
                  return
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleMentionSelect(mentionSelectedIdx, setNewMessage)
                  return
                }
                if (e.key === 'Tab') {
                  e.preventDefault()
                  handleMentionSelect(mentionSelectedIdx, setNewMessage)
                  return
                }
                // Allow typing and other keys
              }
              if (e.key === 'ArrowUp' && !newMessage) {
                e.preventDefault()
                handleEditLastMessage()
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (newMessage.trim()) {
                  handleSend()
                  onSendMessage(newMessage)
                  setNewMessage('')
                  setMentionQuery('')
                  setMentionStart(null)
                  setMentionResults([])
                  if (clearReplyToMessage) clearReplyToMessage()
                }
              }
              // SHIFT+ENTER is default (new line)
            }}
            autoFocus
          />
          {/* Floating mention preview */}
          {mentionResults.length > 0 && mentionStart !== null && (
            <div className='absolute left-0 bottom-[110%] bg-input rounded-lg z-50 w-full'>
              <p className='text-[10px] font-semibold border-b border-border p-2 uppercase'>Users</p>

              {mentionResults.map((user, idx) => (
                <div
                  key={user.user_id}
                  className={cn(
                    'flex justify-between items-center cursor-pointer p-2 hover:bg-white/5 text-xs',
                    idx === mentionSelectedIdx ? 'bg-white/10' : '',
                  )}
                  onClick={() => handleMentionSelect(idx, setNewMessage)}
                  tabIndex={-1}
                  aria-selected={idx === mentionSelectedIdx}
                >
                  <div className='flex items-center'>
                    <Image
                      src={
                        user.avatar_url ||
                        `https://ui-avatars.com/api/?name=${user.username}&background=5865f2&color=fff`
                      }
                      alt={`Avatar of ${user.username}`}
                      className='w-6 h-6 rounded-full mr-2'
                      width={24}
                      height={24}
                    />
                    <span>@{user.username}</span>
                  </div>
                  <span className='text-[10px] text-altwhite'>{user.user_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
