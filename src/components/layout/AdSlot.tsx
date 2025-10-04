import type { ReactElement } from 'react'

import { useEffect, useRef, useState } from 'react'

export default function AdSlot(): ReactElement {
  const iframe1Ref = useRef<HTMLIFrameElement>(null)
  const iframe2Ref = useRef<HTMLIFrameElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [activeIframe, setActiveIframe] = useState<1 | 2>(1)

  const getRandomInterval = (): number => Math.floor(Math.random() * 21) + 10
  // const adUrl = 'http://localhost:3001/ad-page'
  const adUrl = 'https://steamgameidler.com/ad-page'

  useEffect(() => {
    const scheduleNextRefresh = (): NodeJS.Timeout => {
      const randomInterval = getRandomInterval()

      return setTimeout(() => {
        const preloadIframe = activeIframe === 1 ? iframe2Ref.current : iframe1Ref.current

        if (preloadIframe) {
          const refreshUrl = `${adUrl}?t=${Date.now()}`
          preloadIframe.src = refreshUrl

          const handleLoad = (): void => {
            setActiveIframe(prev => (prev === 1 ? 2 : 1))
            preloadIframe.removeEventListener('load', handleLoad)
          }

          preloadIframe.addEventListener('load', handleLoad)
        }

        timeoutRef.current = scheduleNextRefresh()
      }, randomInterval * 1000)
    }

    timeoutRef.current = scheduleNextRefresh()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [activeIframe])

  return (
    <div
      className='relative overflow-hidden rounded-lg mb-2 bg-transparent'
      style={{ width: '218px', height: '145px' }}
    >
      <iframe
        ref={iframe1Ref}
        className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
          activeIframe === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
        src={adUrl}
        width='218'
        height='145'
        title='External Website'
        sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'
      />
      <iframe
        ref={iframe2Ref}
        className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
          activeIframe === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
        src={adUrl}
        width='218'
        height='145'
        title='External Website'
        sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'
      />
    </div>
  )
}
