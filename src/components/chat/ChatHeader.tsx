import type { ReactElement } from 'react'

import { cn, Divider, Skeleton } from '@heroui/react'
import { FaHashtag, FaUsers } from 'react-icons/fa6'

import { useSupabase } from '@/components/contexts/SupabaseContext'

export default function ChatHeader(): ReactElement {
  const { onlineCount, motd } = useSupabase()

  return (
    <div className='bg-black/40 text-white px-4 py-1.5 shadow-sm flex items-center pl-14 select-none'>
      <div className='flex items-center gap-1'>
        <FaHashtag size={12} />
        <h1 className='text-xs'>sgi-chat</h1>
      </div>

      <Divider className='mx-4 h-6 w-px bg-[#3f4147]' />

      {typeof onlineCount === 'number' && (
        <span className={cn('text-xs font-semibold', onlineCount > 0 ? 'text-[#43b581]' : 'text-altwhite')}>
          <FaUsers size={12} className='inline-block mr-1 -mt-0.5' />
          {onlineCount}
        </span>
      )}

      <Divider className='mx-4 h-6 w-px bg-[#3f4147]' />

      {motd ? <p className='text-xs'>{motd}</p> : <Skeleton className='h-3 w-48 rounded-full' />}
    </div>
  )
}
