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
  const [showOverlay, setShowOverlay] = useState(true)
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Reset overlay when ad refreshes
    setShowOverlay(true)

    const loadAd = () => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})

        // Check if ad loaded after a delay
        setTimeout(() => {
          const adIframe = adRef.current?.querySelector('iframe')

          if (!adIframe || adIframe.style.display === 'none') {
            setHasAd(false)
            setShowOverlay(false)
          } else {
            // Check if iframe has actual ad content
            const iframeSrc = adIframe.src || ''
            const hasAdContent =
              iframeSrc.includes('doubleclick') ||
              iframeSrc.includes('googlesyndication') ||
              (adIframe.clientWidth > 0 && adIframe.clientHeight > 0)

            if (hasAdContent) {
              // Ad loaded successfully, remove overlay
              setShowOverlay(false)
              setHasAd(true)
            } else {
              // No ad content, hide the component
              setHasAd(false)
              setShowOverlay(false)
            }
          }
        }, 3000)
      } catch (err) {
        console.error('AdSense error:', err)
        setHasAd(false)
        setShowOverlay(false)
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
    <div
      ref={adRef}
      className='fixed bottom-0 right-0 z-50'
      style={{
        width: '300px',
        height: '250px',
        position: 'relative',
      }}
    >
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
        }}
      />

      {/* Dark overlay that covers the ad until it's confirmed loaded */}
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#121316',
            pointerEvents: 'none',
            transition: 'opacity 300ms ease-out',
          }}
        />
      )}
    </div>
  )
}
