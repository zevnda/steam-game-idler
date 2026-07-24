'use client'

import { useEffect, useRef } from 'react'

interface AdSlotProps {
  slot: string
  className?: string
}

export default function AdSlot({ slot, className = '' }: AdSlotProps) {
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
    <div
      className={`ad-wrapper container mx-auto my-8 max-w-5xl overflow-x-auto px-4 sm:px-6 md:px-8 ${className}`}
    >
      <span className='mb-1 text-xs text-text-secondary'>Advertisement</span>
      <ins
        className='adsbygoogle mx-auto'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot={slot}
        style={{ display: 'inline-block', width: '728px', height: '90px' }}
      />
    </div>
  )
}
