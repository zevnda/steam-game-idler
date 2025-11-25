import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { BiSolidMessageSquareError } from 'react-icons/bi'

import { useStateContext } from '@/components/contexts/StateContext'

export default function ChatMaintenance(): ReactElement {
  const { sidebarCollapsed, transitionDuration } = useStateContext()

  return (
    <div
      className={cn(
        'flex justify-center items-center h-calc',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <div className='flex justify-center items-center flex-col p-6 bg-tab-panel  rounded-4xl border border-border'>
        <div className='flex justify-center items-center flex-col'>
          <BiSolidMessageSquareError size={64} className='mb-4' />
          <h2 className='mb-4 text-2xl font-bold'>Chat Maintenance</h2>
          <p className='text-center font-medium text-content mb-5'>
            The chat system is currently undergoing maintenance.
          </p>
          <p className='text-center font-medium text-content mb-5'>Please check back later.</p>
        </div>
      </div>
    </div>
  )
}
