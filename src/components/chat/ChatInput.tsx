import type { Emoji } from '@/hooks/chat/useEmojiShortcodes'
import type { ReactElement, RefObject } from 'react'

import { Button, cn, Textarea } from '@heroui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { FaImage, FaTrash } from 'react-icons/fa6'
import { IoSend } from 'react-icons/io5'

import ChatReplyPreview from '@/components/chat/ChatReplyPreview'
import { useSupabase } from '@/components/contexts/SupabaseContext'
import ExtLink from '@/components/ui/ExtLink'
import { useEmojiPicker } from '@/hooks/chat/useEmojiPicker'
import { useEmojiShortcodes } from '@/hooks/chat/useEmojiShortcodes'
import { useMarkdownShortcuts } from '@/hooks/chat/useMarkdownShortcuts'
import { useMentionUsers } from '@/hooks/chat/useMentionUsers'
import { supabase } from '@/utils/supabaseClient'
import { logEvent } from '@/utils/tasks'

interface ChatInputProps {
  inputRef: RefObject<HTMLTextAreaElement>
  onSendMessage: (msg: string, replyToId?: string | null) => void
  handleEditLastMessage: () => void
  replyToMessage?: { id: string; username: string; message: string } | null
  clearReplyToMessage?: () => void
  messagesEndRef: RefObject<HTMLDivElement>
}

export default function ChatInput({
  inputRef,
  onSendMessage,
  handleEditLastMessage,
  replyToMessage,
  clearReplyToMessage,
  messagesEndRef,
}: ChatInputProps): ReactElement {
  const [newMessage, setNewMessage] = useState('')
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { t } = useTranslation()
  const { userSummary } = useUserStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentUser = useMemo(
    () => ({
      user_id: userSummary?.steamId ?? '',
      username: userSummary?.personaName ?? '',
    }),
    [userSummary],
  )
  const { typingUsers, broadcastTyping, broadcastStopTyping } = useSupabase()

  const {
    mentionStart,
    mentionResults,
    mentionSelectedIdx,
    setMentionSelectedIdx,
    handleInputChange: handleMentionInputChange,
    handleMentionSelect,
    setMentionQuery,
    setMentionStart,
  } = useMentionUsers(inputRef, newMessage)

  const { showEmojiPicker, setShowEmojiPicker, insertEmoji } = useEmojiPicker(inputRef, newMessage, setNewMessage)

  const {
    emojiStart,
    emojiResults,
    emojiSelectedIdx,
    setEmojiSelectedIdx,
    handleEmojiInputChange,
    handleEmojiSelect,
    setEmojiQuery,
    setEmojiStart,
  } = useEmojiShortcodes(inputRef, newMessage)

  // Add markdown shortcuts hook
  useMarkdownShortcuts(inputRef, newMessage, setNewMessage)

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messagesEndRef])

  // Auto-focus input when typing anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't focus if already focused on an input/textarea
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement
      ) {
        return
      }

      // Don't focus for modifier keys, special keys, or shortcuts
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key.length > 1 || // Special keys like Enter, Escape, Arrow keys, etc.
        e.key === ' '
      ) {
        return
      }

      // Focus the input for printable characters
      if (inputRef.current && !inputRef.current.contains(document.activeElement)) {
        inputRef.current.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inputRef])

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview.url)
      }
    }
  }, [imagePreview])

  const uploadImageToSupabase = useCallback(async (file: File): Promise<string | null> => {
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('sgi-chat') // your bucket name
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('Error uploading image:', error)
        logEvent(`[Error] in uploadImageToSupabase: ${error.message}`)
        return null
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('sgi-chat').getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      logEvent(`[Error] in uploadImageToSupabase: ${error}`)
      return null
    }
  }, [])

  // Broadcast stop_typing on submit
  const handleSend = useCallback(async (): Promise<void> => {
    broadcastStopTyping()

    // If there's an image preview, upload it first
    if (imagePreview) {
      setIsUploading(true)
      const imageUrl = await uploadImageToSupabase(imagePreview.file)
      setIsUploading(false)

      if (imageUrl) {
        // Combine image URL with text message
        const messageContent = newMessage.trim() ? `${newMessage}\n${imageUrl}` : imageUrl
        onSendMessage(messageContent, replyToMessage?.id || null)
        setNewMessage('')
        setImagePreview(null)
        setMentionQuery('')
        setMentionStart(null)
        setEmojiQuery('')
        setEmojiStart(null)
        scrollToBottom()
        if (clearReplyToMessage) clearReplyToMessage()
      }
    } else if (newMessage.trim()) {
      // Send text-only message
      onSendMessage(newMessage, replyToMessage?.id || null)
      setNewMessage('')
      setMentionQuery('')
      setMentionStart(null)
      setEmojiQuery('')
      setEmojiStart(null)
      if (clearReplyToMessage) clearReplyToMessage()
    }
  }, [
    broadcastStopTyping,
    imagePreview,
    newMessage,
    replyToMessage,
    onSendMessage,
    setNewMessage,
    setImagePreview,
    setMentionQuery,
    setMentionStart,
    setEmojiQuery,
    setEmojiStart,
    scrollToBottom,
    clearReplyToMessage,
    uploadImageToSupabase,
  ])

  const handleRemoveImage = useCallback((): void => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url)
      setImagePreview(null)
    }
  }, [imagePreview])

  // Handle paste event for images
  const handleImageUpload = useCallback(async (e: React.ClipboardEvent<HTMLInputElement>): Promise<void> => {
    try {
      const items = e.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()

            // Create preview URL
            const previewUrl = URL.createObjectURL(file)
            setImagePreview({ file, url: previewUrl })
            break
          }
        }
      }
    } catch (error) {
      console.error('Error in handleImageUpload:', error)
      logEvent(`[Error] in handleImageUpload: ${error}`)
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      const file = e.target.files?.[0]
      if (file) {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setImagePreview({ file, url: previewUrl })
        e.target.value = ''
      }
    } catch (error) {
      console.error('Error in handleFileSelect:', error)
      logEvent(`[Error] in handleFileSelect: ${error}`)
    }
  }, [])

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
        onSubmit={async e => {
          e.preventDefault()
          if (newMessage.trim() || imagePreview) {
            await handleSend()
          }
        }}
      >
        <div className='relative'>
          {/* Reply preview */}
          {replyToMessage && clearReplyToMessage && (
            <ChatReplyPreview username={replyToMessage.username} onCancel={clearReplyToMessage} />
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className='mb-2 p-2 border border-border rounded-lg bg-input/50 relative'>
              <div className='flex items-start gap-2'>
                <div className='relative'>
                  <div className='flex justify-center items-center w-auto min-h-[150px] max-h-[150px] min-w-[150px] max-w-[150px] bg-black/10 rounded-lg overflow-hidden border border-border'>
                    <Image
                      src={imagePreview.url}
                      alt='image preview'
                      width={400}
                      height={300}
                      className='max-w-full max-h-[150px] min-w-[150px] w-auto h-auto object-contain rounded-lg my-2'
                    />
                  </div>
                  <p className='text-[10px] text-altwhite/70 my-1 select-none'>{imagePreview.file.name}</p>
                  <FaTrash
                    size={12}
                    onClick={handleRemoveImage}
                    aria-label='Remove image'
                    className='absolute top-1.5 right-1.5 inline ml-2 text-danger hover:opacity-90 cursor-pointer'
                  />
                </div>
              </div>
            </div>
          )}

          <Textarea
            ref={inputRef}
            size='sm'
            placeholder={imagePreview ? t('chat.addTextToImage') : t('chat.inputPlaceholder')}
            className='w-full mb-0 pb-0 resize-y'
            classNames={{
              inputWrapper: cn(
                'border border-border',
                'bg-chat-input data-[hover=true]:!bg-inputhover rounded-md',
                'group-data-[focus-within=true]:!bg-inputhover',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
              ),
              input: ['!min-h-8 !text-content text-xs placeholder:text-xs placeholder:text-altwhite/50 pt-2'],
            }}
            startContent={
              <div className='flex items-center'>
                <Button
                  size='sm'
                  isIconOnly
                  startContent={<FaImage size={16} />}
                  type='button'
                  className='text-white/50 bg-transparent hover:bg-white/10 transition-colors'
                  onPress={() => fileInputRef.current?.click()}
                  aria-label='Upload image'
                />
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml'
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>
            }
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
                      autoFocus
                      data={emojiData}
                      onEmojiSelect={insertEmoji}
                      onClickOutside={() => setShowEmojiPicker(false)}
                    />
                  </div>
                )}

                <Button
                  size='sm'
                  isIconOnly
                  isDisabled={!newMessage.trim() && !imagePreview}
                  isLoading={isUploading}
                  startContent={!isUploading ? <IoSend size={16} /> : undefined}
                  type='submit'
                  className={cn(
                    'bg-transparent hover:bg-white/10 hover:text-dynamic/80 transition-colors',
                    newMessage.trim() || imagePreview ? 'text-dynamic' : 'text-white/10',
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
              const cursorPos = textarea.selectionStart || e.target.value.length
              handleMentionInputChange(e.target.value, cursorPos)
              handleEmojiInputChange(e.target.value, cursorPos, setNewMessage)
              broadcastTyping()
            }}
            onKeyDown={e => {
              // Escape cancels reply or removes image
              if (e.key === 'Escape') {
                if (replyToMessage && clearReplyToMessage) {
                  e.preventDefault()
                  clearReplyToMessage()
                  return
                }
                if (imagePreview) {
                  e.preventDefault()
                  handleRemoveImage()
                  return
                }
                if (emojiResults.length > 0 && emojiStart !== null) {
                  e.preventDefault()
                  setEmojiStart(null)
                  setEmojiQuery('')
                  return
                }
              }
              // Emoji shortcode navigation
              if (emojiResults.length > 0 && emojiStart !== null) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setEmojiSelectedIdx(Math.min(emojiSelectedIdx + 1, emojiResults.length - 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setEmojiSelectedIdx(Math.max(emojiSelectedIdx - 1, 0))
                  return
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleEmojiSelect(emojiSelectedIdx, setNewMessage)
                  return
                }
                if (e.key === 'Tab') {
                  e.preventDefault()
                  handleEmojiSelect(emojiSelectedIdx, setNewMessage)
                  return
                }
              }
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
                if (newMessage.trim() || imagePreview) {
                  handleSend()
                }
              }
              // SHIFT+ENTER is default (new line)
            }}
            onPaste={handleImageUpload}
            autoFocus
          />
          {/* Floating emoji shortcode preview */}
          {emojiResults.length > 0 && emojiStart !== null && (
            <div className='absolute left-0 bottom-[110%] bg-input rounded-lg z-50 w-full max-h-[200px] overflow-y-auto'>
              <p className='text-[10px] font-semibold border-b border-border p-2 uppercase'>Emojis</p>

              {emojiResults.map((emoji: Emoji, idx: number) => (
                <div
                  key={emoji.id}
                  className={cn(
                    'flex items-center gap-1 cursor-pointer p-2 hover:bg-white/5 text-xs',
                    idx === emojiSelectedIdx ? 'bg-white/10' : '',
                  )}
                  onClick={() => handleEmojiSelect(idx, setNewMessage)}
                  tabIndex={-1}
                  aria-selected={idx === emojiSelectedIdx}
                >
                  <span className='text-sm'>{emoji.native}</span>
                  <span>:{emoji.id}:</span>
                </div>
              ))}
            </div>
          )}
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
