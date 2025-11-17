import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { FaUsers } from 'react-icons/fa6'

import { useSupabase } from '@/components/contexts/SupabaseContext'

export default function ChatHeader(): ReactElement {
  const { onlineCount } = useSupabase()

  return (
    <div className='bg-sidebar text-white px-4 py-1.5 flex items-center pl-14 h-9 select-none'>
      {typeof onlineCount === 'number' && (
        <span className={cn('text-xs font-semibold', onlineCount > 0 ? 'text-[#43b581]' : 'text-altwhite')}>
          <FaUsers size={12} className='inline-block mr-1 -mt-0.5' />
          {onlineCount}
        </span>
      )}
    </div>
  )
}
