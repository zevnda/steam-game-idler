import type { ReactElement } from 'react'

import { cn, Divider, Skeleton } from '@heroui/react'

interface ChatHeaderProps {
  motd: string
  onlineCount?: number
}

export default function ChatHeader({ motd, onlineCount }: ChatHeaderProps): ReactElement {
  return (
    <div className='bg-black/20 text-white px-4 py-1.5 shadow-sm flex items-center pl-14'>
      <div className='flex items-center gap-2'>
        <span className='text-altwhite'>#</span>
        <h1 className='text-sm text-white'>sgi-chat</h1>
      </div>

      <Divider className='mx-4 h-6 w-px bg-[#3f4147]' />

      {motd ? <p className='text-sm text-altwhite'>{motd}</p> : <Skeleton className='h-3 w-48 rounded-full' />}

      <Divider className='mx-4 h-6 w-px bg-[#3f4147]' />

      {typeof onlineCount === 'number' && (
        <span className={cn('text-xs font-semibold', onlineCount > 0 ? 'text-[#43b581]' : 'text-altwhite')}>
          {onlineCount} online
        </span>
      )}
    </div>
  )
}
