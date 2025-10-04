'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdOverlay() {
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

  console.log(pathname)

  return (
    <div key={pathname}>
      {/* Desktop side ads */}
      <div className='hidden lg:flex fixed top-1/2 -translate-y-1/2 left-4 flex-col gap-4 z-50 pointer-events-none'>
        <ins
          className='adsbygoogle block rounded-lg'
          data-ad-client='ca-pub-8915288433444527'
          data-ad-slot='9143494556'
          style={{ width: '160px', height: '600px' }}
        />
      </div>

      <div className='hidden lg:flex fixed top-1/2 -translate-y-1/2 right-4 flex-col gap-4 z-50 pointer-events-none'>
        <ins
          className='adsbygoogle block rounded-lg'
          data-ad-client='ca-pub-8915288433444527'
          data-ad-slot='3005445709'
          style={{ width: '160px', height: '600px' }}
        />
      </div>

      {/* Mobile/Tablet banner ad */}
      {pathname !== '/ad-page' && (
        <div className='lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none'>
          <ins
            className='adsbygoogle block rounded-lg'
            data-ad-client='ca-pub-8915288433444527'
            data-ad-slot='1265004536'
            style={{ width: '300px', height: '50px' }}
          />
        </div>
      )}
    </div>
  )
}
