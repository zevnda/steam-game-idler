import { cn } from '@heroui/react'
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize } from 'react-icons/vsc'

import { HelpDesk } from '@/shared/ui/title-bar/components/HelpDesk'
import { Menu } from '@/shared/ui/title-bar/components/Menu'
import { windowClose, windowMinimize, windowToggleMaximize } from '@/shared/ui/title-bar/utils'

// TODO:
// Add compat with sidebar when implemented
// Only render menu and notifications when isAuthenticated

export const TitleBar = () => {
  return (
    <div className='absolute top-0 left-0 select-none flex items-center h-9' data-tauri-drag-region>
      <div className='flex justify-end w-screen' data-tauri-drag-region>
        <div className='flex justify-center items-center'>
          {/* Helpdesk */}
          <HelpDesk />

          {/* Dropdown Menu */}
          <Menu />

          {/* Window Controls */}
          <div
            className={cn(
              'flex justify-center items-center',
              'hover:bg-header-hover/10 h-9 w-12 px-2 duration-150 cursor-pointer',
              'hover:text-white transition-colors',
            )}
            onClick={windowMinimize}
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                windowMinimize()
              }
            }}
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
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                windowToggleMaximize()
              }
            }}
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
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                windowClose()
              }
            }}
          >
            <VscChromeClose fontSize={16} className='text-content' />
          </div>
        </div>
      </div>
    </div>
  )
}
