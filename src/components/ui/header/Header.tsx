import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useNavigationStore } from '@/stores/navigationStore'
import { useStateStore } from '@/stores/stateStore'
import { useUpdateStore } from '@/stores/updateStore'
import { TbLayoutSidebar, TbLayoutSidebarFilled } from 'react-icons/tb'
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize } from 'react-icons/vsc'

import Notifications from '@/components/notifications/Notifications'
import HeaderMenu from '@/components/ui/header/HeaderMenu'
import UpdateButton from '@/components/ui/UpdateButton'
import useHeader from '@/hooks/ui/useHeader'
import { isPortableCheck } from '@/utils/tasks'

export default function Header(): ReactElement {
  const { windowMinimize, windowToggleMaximize, windowClose } = useHeader()
  const updateAvailable = useUpdateStore(state => state.updateAvailable)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const setSidebarCollapsed = useStateStore(state => state.setSidebarCollapsed)
  const setTransitionDuration = useStateStore(state => state.setTransitionDuration)
  const activePage = useNavigationStore(state => state.activePage)
  const [isPortable, setIsPortable] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      const portable = await isPortableCheck()
      setIsPortable(portable)
    })()
  }, [])

  return (
    <div
      className={cn(
        'absolute top-0 right-0 select-none pr-0 h-9 z-48 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : activePage === 'setup' ? 'w-full' : 'w-calc',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
      data-tauri-drag-region
    >
      <div className='flex justify-between gap-1.5 h-9 w-full' data-tauri-drag-region>
        {activePage !== 'setup' && activePage !== 'settings' && (
          <div
            className={cn(
              'flex justify-center items-center p-2 cursor-pointer group',
              'text-content hover:bg-sidebar/40 hover:text-content/80 h-9 w-12',
              'rounded-br-xl',
            )}
            style={{
              transitionProperty: 'margin-left, color, background-color',
              transitionDuration: `${transitionDuration}, 150ms, 150ms`,
              transitionTimingFunction: 'ease-in-out, ease, ease',
            }}
            onClick={() => {
              setTransitionDuration('300ms')
              setSidebarCollapsed(!sidebarCollapsed)
              localStorage.setItem('sidebarCollapsed', String(!sidebarCollapsed))
              setTimeout(() => {
                setTransitionDuration('0ms')
              }, 100)
            }}
          >
            {sidebarCollapsed ? <TbLayoutSidebarFilled fontSize={18} /> : <TbLayoutSidebar fontSize={18} />}
          </div>
        )}

        <div className='flex justify-end items-center h-full w-full' data-tauri-drag-region>
          {isPortable === false && updateAvailable && <UpdateButton />}

          {activePage !== 'setup' && (
            <>
              <Notifications />
              <HeaderMenu />
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
                <VscChromeMinimize fontSize={16} className='text-content' />
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
                <VscChromeMaximize fontSize={16} className='text-content' />
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
                <VscChromeClose fontSize={16} className='text-content' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
