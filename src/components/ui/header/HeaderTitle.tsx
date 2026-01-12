import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useStateStore } from '@/stores/stateStore'

import Logo from '@/components/ui/header/Logo'

export default function HeaderTitle(): ReactElement {
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)

  return (
    <div
      className={cn('flex items-center duration-300', sidebarCollapsed ? 'justify-center' : 'justify-start ml-2')}
      data-tauri-drag-region
    >
      <Logo />

      {!sidebarCollapsed && (
        <div
          className={cn(
            'flex justify-between items-center duration-500 ease-in-out overflow-hidden whitespace-nowrap transition-all',
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
