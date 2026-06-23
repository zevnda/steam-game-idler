'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

export default function AdComponent() {
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  return (
    <div className='fixed bottom-0 right-0 z-50 bg-[#121316]'>
      <ins
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='9100790437'
        style={{ display: 'block', width: '300px', height: '250px' }}
      />
    </div>
  )
}
