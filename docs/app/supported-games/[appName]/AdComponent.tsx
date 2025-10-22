'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function AdComponent() {
  const [adKey, setAdKey] = useState(0)

  useEffect(() => {
    const loadAd = () => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (err) {
        console.error('AdSense error:', err)
      }
    }

    loadAd()

    const scheduleNextRefresh = () => {
      const interval = setTimeout(() => {
        setAdKey(prev => prev + 1)
        scheduleNextRefresh()
      }, 30 * 1000)

      return interval
    }

    const timeoutId = scheduleNextRefresh()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className='fixed bottom-0 right-0 z-50 bg-[#121316]'>
      <ins
        key={adKey}
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='9100790437'
        data-full-width-responsive='true'
        style={{ display: 'block', width: '300px', height: '250px' }}
      />
    </div>
  )
}
