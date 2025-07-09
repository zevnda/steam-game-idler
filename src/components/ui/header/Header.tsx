import type { ReactElement } from 'react'

import { cn, Divider } from '@heroui/react'
import { TbLayoutSidebar, TbLayoutSidebarFilled, TbMinus, TbSquare, TbX } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'
import { useUpdateContext } from '@/components/contexts/UpdateContext'
import Notifications from '@/components/notifications/Notifications'
import HeaderMenu from '@/components/ui/header/HeaderMenu'
import UpdateButton from '@/components/ui/UpdateButton'
import useHeader from '@/hooks/ui/useHeader'

export default function Header(): ReactElement {
  const { updateAvailable } = useUpdateContext()
  const { windowMinimize, windowToggleMaximize, windowClose } = useHeader()
  const { sidebarCollapsed, setSidebarCollapsed, setTransitionDuration } = useStateContext()
  const { activePage } = useNavigationContext()

  return (
    <div
      className={cn(
        'absolute w-full top-0 right-0 select-none pr-0 h-9 z-50',
        activePage === 'setup' ? 'backdrop-blur-xl bg-base/40' : 'bg-transparent',
      )}
      data-tauri-drag-region
    >
      <div className='flex justify-between gap-1.5 h-9 w-full' data-tauri-drag-region>
        {activePage !== 'setup' && activePage !== 'settings' && (
          <div
            className={cn(
              'p-2 transition-[margin-left] duration-500 ease-in-out cursor-pointer group text-content hover:text-altwhite',
              sidebarCollapsed ? 'ml-[56px]' : 'ml-[250px]',
            )}
            onClick={() => {
              setTransitionDuration('500ms')
              setSidebarCollapsed(!sidebarCollapsed)
              setTimeout(() => {
                setTransitionDuration('0ms')
              }, 100)
            }}
          >
            {sidebarCollapsed ? <TbLayoutSidebarFilled fontSize={18} /> : <TbLayoutSidebar fontSize={18} />}
          </div>
        )}

        <div className='flex justify-end items-center gap-1.5 h-full w-full' data-tauri-drag-region>
          {updateAvailable && <UpdateButton />}

          {activePage !== 'setup' && (
            <>
              <Notifications />
              <HeaderMenu />
              <Divider className='w-[1px] h-6 bg-border/60' />
            </>
          )}

          <div className='flex justify-center items-center'>
            <div className='flex justify-center items-center'>
              <div
                className={cn(
                  'flex justify-center items-center',
                  'hover:bg-header-hover/10 h-9 w-12 px-2 duration-150 cursor-pointer',
                  'hover:text-white transition-colors',
                )}
                onClick={windowMinimize}
              >
                <TbMinus fontSize={16} className='text-content' />
              </div>
            </div>

            <div className='flex justify-center items-center'>
              <div
                className={cn(
                  'flex justify-center items-center',
                  'hover:bg-header-hover/10 h-9 w-12 px-2.5 duration-150 cursor-pointer',
                  'hover:text-white transition-colors',
                )}
                onClick={windowToggleMaximize}
              >
                <TbSquare fontSize={12} className='text-content' />
              </div>
            </div>

            <div className='flex justify-center items-center'>
              <div
                className={cn(
                  'flex justify-center items-center',
                  'hover:bg-danger/90 h-9 w-12 px-2 duration-150 cursor-pointer',
                  'hover:text-white transition-colors',
                )}
                onClick={windowClose}
              >
                <TbX fontSize={16} className='text-content' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
