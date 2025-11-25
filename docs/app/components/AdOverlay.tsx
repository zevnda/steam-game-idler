'use client'

import type { ReactElement } from 'react'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdOverlay(): ReactElement | null {
  const pathname = usePathname()

  useEffect(() => {
    try {
      const adElements = document.querySelectorAll('.adsbygoogle')
      adElements.forEach(() => {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      })
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [pathname])

  if (pathname.includes('/supported-games/') || pathname.includes('/changelog/')) {
    return null
  }

  return (
    <div key={pathname}>
      {/* Desktop side ads */}
      <div className='hidden 2xl:flex fixed top-1/2 -translate-y-1/2 left-4 flex-col gap-4 z-50'>
        <ins
          className='adsbygoogle'
          data-ad-client='ca-pub-8915288433444527'
          data-ad-slot='9143494556'
          style={{ display: 'block', width: '160px', height: '600px' }}
        />
      </div>

      <div className='hidden md:flex fixed bottom-4 right-4 flex-col gap-4 z-50'>
        <ins
          className='adsbygoogle'
          data-ad-client='ca-pub-8915288433444527'
          data-ad-slot='3005445709'
          style={{ display: 'block', width: '300px', height: '250px' }}
        />
      </div>

      {/* Mobile/Tablet banner ad */}
      <div className='fixed md:hidden bottom-4 left-1/2 -translate-x-1/2 z-50'>
        <ins
          className='adsbygoogle'
          data-ad-client='ca-pub-8915288433444527'
          data-ad-slot='1265004536'
          style={{ display: 'block', width: '300px', height: '50px' }}
        />
      </div>
    </div>
  )
}
