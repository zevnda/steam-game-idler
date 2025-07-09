import type { ReactElement } from 'react'

import { cn } from '@heroui/react'

import { useStateContext } from '@/components/contexts/StateContext'
import Logo from '@/components/ui/header/Logo'

export default function HeaderTitle(): ReactElement {
  const { sidebarCollapsed } = useStateContext()

  return (
    <div
      className={cn('flex items-center duration-300', sidebarCollapsed ? 'justify-center' : 'justify-start ml-2')}
      data-tauri-drag-region
    >
      <Logo />

      {!sidebarCollapsed && (
        <div
          className={cn(
            'flex justify-between items-center duration-500 overflow-hidden whitespace-nowrap transition-all',
          )}
          data-tauri-drag-region
        >
          <p className={cn('font-medium text-content text-sm ml-3')} data-tauri-drag-region>
            Steam Game Idler
          </p>
        </div>
      )}
    </div>
  )
}
