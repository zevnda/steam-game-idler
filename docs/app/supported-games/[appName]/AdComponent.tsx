'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

export default function AdComponent() {
  const [adKey, setAdKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    window.top?.postMessage({ type: 'ad-refresh' }, '*')

    const loadAd = () => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (err) {
        console.error('AdSense error:', err)
      }
    }

    loadAd()

    observerRef.current?.disconnect()

    const insEl = containerRef.current?.querySelector('ins.adsbygoogle')
    if (insEl) {
      const observer = new MutationObserver(() => {
        const status = insEl.getAttribute('data-ad-status')
        if (status) {
          window.top?.postMessage({ type: 'ad-status', filled: status === 'filled' }, '*')
          observer.disconnect()
        }
      })
      observer.observe(insEl, { attributes: true, attributeFilter: ['data-ad-status'] })
      observerRef.current = observer
    }

    const scheduleNextRefresh = () => {
      const interval = setTimeout(
        () => {
          setAdKey(prev => prev + 1)
          scheduleNextRefresh()
        },
        1.25 * 60 * 1000,
      )

      return interval
    }

    const timeoutId = scheduleNextRefresh()

    return () => {
      clearTimeout(timeoutId)
      observerRef.current?.disconnect()
    }
  }, [adKey])

  return (
    <div ref={containerRef} className='fixed bottom-0 right-0 z-50 bg-[#121316]'>
      <ins
        key={adKey}
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='9100790437'
        style={{ display: 'block', width: '300px', height: '250px' }}
      />
    </div>
  )
}
