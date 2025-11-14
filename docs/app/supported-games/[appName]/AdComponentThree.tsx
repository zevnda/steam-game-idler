'use client'

import type { ReactElement } from 'react'

import { useEffect } from 'react'

export default function AdComponentThree(): ReactElement {
  useEffect(() => {
    try {
      const adElements = document.querySelectorAll('.adsbygoogle')
      adElements.forEach(() => {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      })
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  return (
    <div className='hidden 2xl:flex fixed top-1/2 -translate-y-1/2 left-4 flex-col gap-4 z-40'>
      <ins
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='9143494556'
        style={{ display: 'block', width: '160px', height: '600px' }}
      />
    </div>
  )
}
