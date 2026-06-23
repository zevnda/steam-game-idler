'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

export default function AdComponentTwo() {
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  return (
    <div className='flex fixed top-0 left-0 flex-col gap-4 z-40 bg-[#121316]'>
      <ins
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='3005445709'
        data-full-width-responsive='true'
        style={{ display: 'block', width: '300px', height: '250px' }}
      />
    </div>
  )
}
