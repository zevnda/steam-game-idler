import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { BiSolidMessageSquareError } from 'react-icons/bi'

import { useStateContext } from '@/components/contexts/StateContext'

export default function ChatBanned(): ReactElement {
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
      <div className='flex justify-center items-center flex-col p-6 bg-tab-panel rounded-4xl border border-border'>
        <div className='flex justify-center items-center flex-col'>
          <BiSolidMessageSquareError size={64} className='mb-4' />
          <h2 className='mb-4 text-2xl font-bold text-danger'>Banned</h2>
          <p className='text-center font-medium text-content mb-5'>You have been banned from the chat.</p>
          <p className='text-center font-medium text-content mb-5'>
            If you believe this is a mistake, please open an issue on GitHub.
          </p>
        </div>
      </div>
    </div>
  )
}
