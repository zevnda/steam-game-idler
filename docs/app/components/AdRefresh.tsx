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
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        try {
          const ads = document.querySelectorAll('.adsbygoogle')
          ads.forEach(ad => {
            const adElement = ad as HTMLElement
            adElement.removeAttribute('data-adsbygoogle-status')
            adElement.innerHTML = ''
            ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          })
        } catch (e) {
          console.log('Error refreshing ads:', e)
        }
      }
    }

    const timer = setTimeout(refreshAds, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
