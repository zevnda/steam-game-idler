import type { ReactElement } from 'react'

import { cn, Spinner } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'

export default function AdSlot(): ReactElement {
  const { sidebarCollapsed } = useStateContext()
  const { activePage } = useNavigationContext()
  const [iframeKey, setIframeKey] = useState(0)

  const refreshIframe = useCallback(() => {
    setIframeKey(prev => prev + 1)
  }, [])

  useEffect(() => {
    const scheduleNextRefresh = (): NodeJS.Timeout => {
      return setTimeout(() => {
        refreshIframe()
        scheduleNextRefresh()
      }, 30000)
    }

    const timeoutId = scheduleNextRefresh()

    return () => clearTimeout(timeoutId)
  }, [refreshIframe])

  return (
    <div
      className={cn(
        'bg-sidebar/80 border border-border/70 p-2 rounded-lg -mb-6 transition-all ease-in-out',
        sidebarCollapsed && activePage !== 'settings' ? 'scale-[.160]' : 'scale-[.75]',
        sidebarCollapsed ? 'duration-100' : 'duration-450',
      )}
    >
      <div className='relative flex justify-center items-center overflow-hidden rounded-lg'>
        <iframe
          key={iframeKey}
          className='overflow-scroll rounded-lg -mt-[351px] -ml-[300px] z-[1]'
          src='https://steamgameidler.com/ad-page'
          width='600'
          height='600'
          title='External Website'
          sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'
        />
        <Spinner className='absolute inset-0 m-auto z-[0]' />
      </div>
    </div>
  )
}
