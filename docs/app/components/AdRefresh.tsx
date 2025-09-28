'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function AdRefresh() {
  const pathname = usePathname()

  useEffect(() => {
    const refreshAds = () => {
      if (typeof window !== 'undefined') {
        try {
          const ads = document.querySelectorAll('.adsbygoogle')
          ads.forEach(ad => {
            if (ad.innerHTML.trim() !== '') {
              ad.innerHTML = ''
            }
          })
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        } catch (e) {
          console.log('Error refreshing ads:', e)
        }
      }
    }

    const timer = setTimeout(refreshAds, 100)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
