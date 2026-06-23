'use client'

import { useEffect, useRef } from 'react'

interface AdOverlayProps {
  slot: string
  className?: string
}

export default function AdOverlay({ slot, className = '' }: AdOverlayProps) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  return (
    <div className={`ad-wrapper my-8 ${className}`}>
      <span className='mb-1 text-xs text-text-secondary'>Advertisement</span>
      <ins
        className='adsbygoogle w-full'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot={slot}
        data-ad-format='auto'
        data-full-width-responsive='true'
        style={{ display: 'block' }}
      />
    </div>
  )
}
