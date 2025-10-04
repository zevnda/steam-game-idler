import type { ReactElement } from 'react'

import { Spinner } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'

export default function AdSlot(): ReactElement {
  const [iframeKey, setIframeKey] = useState(0)

  const refreshIframe = useCallback(() => {
    setIframeKey(prev => prev + 1)
  }, [])

  useEffect(() => {
    const scheduleNextRefresh = (): NodeJS.Timeout => {
      const randomInterval = Math.floor(Math.random() * 20000) + 10000

      return setTimeout(() => {
        refreshIframe()
        scheduleNextRefresh()
      }, randomInterval)
    }

    const timeoutId = scheduleNextRefresh()

    return () => clearTimeout(timeoutId)
  }, [refreshIframe])

  return (
    <div className='bg-sidebar/80 border border-border/70 p-2 rounded-lg'>
      <div className='relative flex justify-center items-center overflow-hidden rounded-lg'>
        <iframe
          key={iframeKey}
          className='overflow-scroll rounded-lg -mt-[155px] -ml-[82px] z-[1]'
          src='https://steamgameidler.com/ad-page'
          width='300'
          height='300'
          title='External Website'
          sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'
        />
        <Spinner className='absolute inset-0 m-auto z-[0]' />
      </div>
    </div>
  )
}
