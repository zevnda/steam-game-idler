'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function AdRefresh() {
  const pathname = usePathname()
  const initialLoad = useRef(true)

  useEffect(() => {
    // Allow initial load to happen naturally
    if (initialLoad.current) {
      initialLoad.current = false
      return
    }

    // For auto ads on navigation, just push an empty object
    const refreshAutoAds = () => {
      try {
        if (window.adsbygoogle) {
          // Push empty object to trigger ad refresh without page-level config
          window.adsbygoogle.push({})
        }
      } catch (error) {
        console.error('Error refreshing auto ads:', error)
      }
    }

    // Give the page time to fully render before refreshing ads
    const timer = setTimeout(refreshAutoAds, 500)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
