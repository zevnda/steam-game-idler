'use client'

import type { ReactElement } from 'react'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

export default function AdComponentTwo(): ReactElement {
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
        3 * 60 * 1000,
      )

      return interval
    }

    const timeoutId = scheduleNextRefresh()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [adKey])

  return (
    <div className='flex fixed top-0 left-0 flex-col gap-4 z-40 bg-[#121316]'>
      <ins
        key={adKey}
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='3005445709'
        data-full-width-responsive='true'
        style={{ display: 'block', width: '300px', height: '250px' }}
      />
    </div>
  )
}
