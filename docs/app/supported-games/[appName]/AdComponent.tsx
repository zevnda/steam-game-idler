'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function AdComponent() {
  useEffect(() => {
    const loadAd = () => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (err) {
        console.error('AdSense error:', err)
      }
    }

    loadAd()
  }, [])

  return (
    <div className='fixed bottom-0 right-0 z-50'>
      <ins
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='9100790437'
        data-full-width-responsive='true'
        style={{ display: 'block', width: '300px', height: '250px' }}
      />
    </div>
  )
}
