'use client'

import type { ReactElement } from 'react'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

export default function AdComponent(): ReactElement {
  const [adKey, setAdKey] = useState(0)

  useEffect(() => {
    const loadAd = (): void => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (err) {
        console.error('AdSense error:', err)
      }
    }

    loadAd()

    const scheduleNextRefresh = (): NodeJS.Timeout => {
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
    }
  }, [adKey])

  return (
    <div className='fixed bottom-0 right-0 z-50 bg-[#121316]'>
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
