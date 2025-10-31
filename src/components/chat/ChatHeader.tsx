import type { ReactElement } from 'react'

import { Skeleton } from '@heroui/react'

interface ChatHeaderProps {
  motd: string
}

export default function ChatHeader({ motd }: ChatHeaderProps): ReactElement {
  return (
    <div className='bg-black/20 text-white px-4 py-1.5 shadow-sm flex items-center pl-14'>
      <div className='flex items-center gap-2'>
        <span className='text-[#80848e]'>#</span>
        <h1 className='text-sm text-white'>sgi-chat</h1>
      </div>
      <div className='ml-4 h-6 w-px bg-[#3f4147]' />
      {motd ? (
        <p className='ml-4 text-sm text-[#b5bac1]'>{motd}</p>
      ) : (
        <Skeleton className='ml-4 h-3 w-48 rounded-full' />
      )}
    </div>
  )
}
