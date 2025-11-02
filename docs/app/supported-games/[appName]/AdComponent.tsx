'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function AdComponent() {
  const [adKey, setAdKey] = useState(0)
  const [showOverlay, setShowOverlay] = useState(true)
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowOverlay(true)

    const loadAd = () => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})

        // Wait for iframe to appear and check if ad loaded
        setTimeout(() => {
          const adIframe = adRef.current?.querySelector('iframe')
          if (adIframe) {
            const iframeSrc = adIframe.src || ''
            const hasContent = iframeSrc.includes('doubleclick') || iframeSrc.includes('googleads')

            if (hasContent) {
              setShowOverlay(false)
            }
          }
        }, 2000)
      } catch (err) {
        console.error('AdSense error:', err)
      }
    }

    loadAd()

    const scheduleNextRefresh = () => {
      const interval = setTimeout(
        () => {
          setAdKey(prev => prev + 1)
          scheduleNextRefresh()
        },
        2 * 60 * 1000,
      )

      return interval
    }

    const timeoutId = scheduleNextRefresh()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [adKey])

  return (
    <>
      <div ref={adRef} className='fixed bottom-0 right-0 z-50 bg-[#121316]' style={{ width: '300px', height: '250px' }}>
        <ins
          key={adKey}
          className='adsbygoogle'
          data-ad-client='ca-pub-8915288433444527'
          data-ad-slot='9100790437'
          data-full-width-responsive='true'
          style={{ display: 'block', width: '300px', height: '250px' }}
        />
      </div>

      {showOverlay && (
        <div className='fixed bottom-0 right-0 z-50 bg-[#121316]' style={{ width: '300px', height: '250px' }} />
      )}
    </>
  )
}
