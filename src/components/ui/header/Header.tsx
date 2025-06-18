import type { ReactElement } from 'react'

import { cn, Divider } from '@heroui/react'
import { TbMinus, TbSquare, TbX } from 'react-icons/tb'

import { useUpdateContext } from '@/components/contexts/UpdateContext'
import Notifications from '@/components/notifications/Notifications'
import HeaderMenu from '@/components/ui/header/HeaderMenu'
import HeaderTitle from '@/components/ui/header/HeaderTitle'
import SearchBar from '@/components/ui/header/SearchBar'
import UpdateButton from '@/components/ui/UpdateButton'
import useHeader from '@/hooks/ui/useHeader'

export default function Header(): ReactElement {
  const { updateAvailable } = useUpdateContext()
  const { windowMinimize, windowToggleMaximize, windowClose } = useHeader()

  return (
    <div className='relative w-full h-10 bg-titlebar select-none' data-tauri-drag-region>
      <div className='flex justify-between items-center h-full'>
        <div className='flex justify-center items-center flex-grow gap-1.5 h-full' data-tauri-drag-region>
          <HeaderTitle />

          <SearchBar />

          {updateAvailable && <UpdateButton />}

          <Notifications />

          <Divider className='w-px h-5 bg-border/60' />

          <HeaderMenu />

          <Divider className='w-px h-5 bg-border/60' />

          <div className='flex justify-center items-center gap-0.5 h-full mr-2'>
            <div className='flex justify-center items-center'>
              <div
                className='hover:bg-titlehover p-1.5 rounded-md duration-150 cursor-pointer active:scale-95'
                onClick={windowMinimize}
              >
                <TbMinus fontSize={20} className='text-content' />
              </div>
            </div>

            <div className='flex justify-center items-center'>
              <div
                className='hover:bg-titlehover p-[8px] rounded-md duration-150 cursor-pointer active:scale-95'
                onClick={windowToggleMaximize}
              >
                <TbSquare fontSize={16} className='text-content' />
              </div>
            </div>

            <div className='flex justify-center items-center'>
              <div
                className={cn(
                  'hover:bg-danger/90 p-1.5 rounded-md duration-150 cursor-pointer active:scale-95',
                  'hover:text-white transition-colors',
                )}
                onClick={windowClose}
              >
                <TbX fontSize={20} className='text-content' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
