'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function AdComponent() {
  const [adKey, setAdKey] = useState(0)
  const [hasAd, setHasAd] = useState(true)
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadAd = () => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})

        // Check if ad loaded after a delay
        setTimeout(() => {
          const adIframe = adRef.current?.querySelector('iframe')
          if (!adIframe || adIframe.style.display === 'none') {
            setHasAd(false)
          } else {
            setHasAd(true)
          }
        }, 3000)
      } catch (err) {
        console.error('AdSense error:', err)
        setHasAd(false)
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

  if (!hasAd) return null

  return (
    <div ref={adRef} className='fixed bottom-0 right-0 z-50 bg-[#121316]'>
      <ins
        key={adKey}
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='9100790437'
        data-full-width-responsive='true'
        style={{
          display: 'block',
          width: '300px',
          height: '250px',
          backgroundColor: '#121316',
        }}
      />
    </div>
  )
}
