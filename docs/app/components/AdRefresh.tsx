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

    // For auto ads, we need to tell AdSense to re-scan the page
    const refreshAutoAds = () => {
      try {
        if (window.adsbygoogle) {
          // Push an empty object to trigger auto ad refresh
          window.adsbygoogle.push({
            google_ad_client: 'ca-pub-8915288433444527',
            enable_page_level_ads: true,
          })
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
