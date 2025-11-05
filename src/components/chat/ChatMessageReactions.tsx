import type { MessageReaction } from '@/hooks/chat/useMessageReactions'
import type { ReactElement } from 'react'

import { cn, Popover, PopoverContent, PopoverTrigger } from '@heroui/react'
import { useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { FaSmile } from 'react-icons/fa'

import CustomTooltip from '@/components/ui/CustomTooltip'

interface ChatMessageReactionsProps {
  messageId: string
  reactions: MessageReaction[]
  userSteamId: string
  onAddReaction: (messageId: string, emoji: string) => void
  onRemoveReaction: (messageId: string, emoji: string) => void
}

export default function ChatMessageReactions({
  messageId,
  reactions,
  userSteamId,
  onAddReaction,
  onRemoveReaction,
}: ChatMessageReactionsProps): ReactElement {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleEmojiSelect = (emoji: { native: string }): void => {
    onAddReaction(messageId, emoji.native)
    setShowEmojiPicker(false)
  }

  const handleReactionClick = (emoji: string, hasReacted: boolean): void => {
    if (hasReacted) {
      onRemoveReaction(messageId, emoji)
    } else {
      onAddReaction(messageId, emoji)
    }
  }

  return (
    <div className='flex items-center gap-1 mt-1 flex-wrap'>
      {reactions.map(reaction => {
        const hasReacted = reaction.user_ids.includes(userSteamId)
        const tooltipContent =
          reaction.usernames && reaction.usernames.length > 0 ? reaction.usernames.join('\n') : 'No users'

        return (
          <CustomTooltip
            key={reaction.emoji}
            content={tooltipContent}
            placement='top'
            className='text-[10px] whitespace-pre-line'
          >
            <button
              onClick={() => handleReactionClick(reaction.emoji, hasReacted)}
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs transition-all cursor-pointer',
                'border border-border hover:border-[#5865f2] hover:bg-[#5865f2]/10',
                hasReacted ? 'bg-[#5865f2]/20 border-[#5865f2]' : 'bg-[#2b2d31]',
              )}
            >
              <span className='text-sm'>{reaction.emoji}</span>
              <span className={cn('text-xs font-medium', hasReacted ? 'text-[#a5adfc]' : 'text-[#b5bac1]')}>
                {reaction.count}
              </span>
            </button>
          </CustomTooltip>
        )
      })}

      <Popover isOpen={showEmojiPicker} onOpenChange={setShowEmojiPicker} placement='top'>
        <PopoverTrigger>
          <button
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-md text-xs transition-all',
              'border border-border hover:border-[#5865f2] hover:bg-[#5865f2]/10 bg-[#2b2d31] cursor-pointer',
            )}
          >
            <FaSmile size={13} className='text-[#b5bac1]' />
          </button>
        </PopoverTrigger>
        <PopoverContent className='p-0 border-0 bg-transparent'>
          <Picker
            autoFocus
            data={data}
            onEmojiSelect={handleEmojiSelect}
            onClickOutside={() => setShowEmojiPicker(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
