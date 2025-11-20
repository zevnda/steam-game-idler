import type { ReactElement } from 'react'

import { cn } from '@heroui/react'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'
import GoProModal from '@/components/ui/GoProModal'

export function GoPro(): ReactElement {
  const { setProModalOpen } = useStateContext()
  const { activePage } = useNavigationContext()

  return (
    <>
      <div
        className={cn('shiny-cta flex justify-between items-center', activePage === 'settings' && 'ml-12')}
        onClick={() => setProModalOpen(true)}
      >
        <p className='flex flex-col font-bold items-center w-[90px] text-[8px] space-y-0.5'>
          SUPPORT
          <span className='block w-full text-center'>STEAM GAME IDLER</span>
        </p>
        <div className='bg-white py-1 px-1.5 rounded-full h-[90%] w-[52px] flex items-center'>
          <p className='text-[10px] font-black text-[#3874fb] italic text-center'>GO PRO</p>
        </div>
      </div>
      <GoProModal />
    </>
  )
}
