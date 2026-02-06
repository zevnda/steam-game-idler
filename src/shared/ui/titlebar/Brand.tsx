import { cn } from '@heroui/react'
import { useStateStore, useUserStore } from '@/shared/stores'
import { Logo, ProBadge } from '@/shared/ui'

export const Brand = () => {
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const isPro = useUserStore(state => state.isPro)

  return (
    <div
      className={cn(
        'flex items-center duration-300',
        sidebarCollapsed ? 'justify-center' : 'justify-start ml-2',
      )}
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
            {isPro !== null && isPro === true && <ProBadge className='scale-80' />}
          </p>
        </div>
      )}
    </div>
  )
}
