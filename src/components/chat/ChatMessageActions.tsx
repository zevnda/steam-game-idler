import type { ReactElement } from 'react'

import { Button, cn } from '@heroui/react'
import { FaPencilAlt, FaThumbtack, FaTrashAlt } from 'react-icons/fa'

interface ChatMessageActionsProps {
  onEdit: () => void
  onDelete: () => void
  onPin?: () => void
  onUnpin?: () => void
  isPinned?: boolean
  isAdmin?: boolean
}

export default function ChatMessageActions({
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  isPinned,
  isAdmin,
}: ChatMessageActionsProps): ReactElement {
  return (
    <div className='absolute right-4 -top-2 flex opacity-0 group-hover:opacity-100 z-10 bg-[#181818] rounded-sm border border-[#1e1e1e]'>
      {isAdmin && (
        <Button
          isIconOnly
          radius='none'
          className={cn(
            'bg-transparent h-6 w-5 flex items-center justify-center',
            'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
          )}
          startContent={<FaThumbtack size={12} className={isPinned ? 'text-yellow-400' : 'text-altwhite'} />}
          onPress={isPinned ? onUnpin : onPin}
          aria-label={isPinned ? 'Unpin message' : 'Pin message'}
        />
      )}
      <Button
        isIconOnly
        radius='none'
        className={cn(
          'bg-transparent h-6 w-5 flex items-center justify-center',
          'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
        )}
        startContent={<FaPencilAlt size={12} className='text-altwhite' />}
        onPress={onEdit}
      />
      <Button
        isIconOnly
        radius='none'
        className={cn(
          'bg-transparent h-6 w-5 flex items-center justify-center',
          'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
        )}
        startContent={<FaTrashAlt size={12} className='text-[#f23f43]' />}
        onPress={onDelete}
      />
    </div>
  )
}
