import type { ReactElement } from 'react'
import { cn } from '@heroui/react'
import { useNavigationStore } from '@/shared/stores/navigationStore'
import { useStateStore } from '@/shared/stores/stateStore'

export function GoPro(): ReactElement {
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const activePage = useNavigationStore(state => state.activePage)

  return (
    <div
      className={cn(
        'shiny-cta flex justify-between items-center',
        activePage === 'settings' && 'ml-12',
      )}
      onClick={() => setProModalOpen(true)}
    >
      <p className='flex flex-col font-bold items-center w-22.5 text-[8px] space-y-0.5'>
        SUPPORT
        <span className='block w-full text-center'>STEAM GAME IDLER</span>
      </p>
      <div className='bg-white py-1 px-1.5 rounded-full h-[90%] w-13 flex items-center'>
        <p className='text-[10px] font-black text-[#0092d0] italic text-center'>GO PRO</p>
      </div>
    </div>
  )
}
