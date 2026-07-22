'use client'

import { useEffect, useRef } from 'react'

// Fixed bottom-right ad unit for /supported-games/* pages. Always renders for every visitor
// (organic search traffic or the app's sidebar iframe) - unlike a purely embed-gated slot, these
// pages exist specifically to host this ad, so there's no reason to hide it from real visitors.
// Fill/unfill is reported to the parent window purely via AdSense's own native `adpnt`
// postMessage - no custom relay needed, and it's a harmless no-op when nothing is listening (i.e.
// a real visitor browsing the page directly, where window.top is just this same window).
export default function FloatingAd() {
  const pushed = useRef(false)

  useEffect(() => {
    // When embedded (the app's sidebar iframe), suppress this document's own scrolling so the
    // fixed ad never ends up behind a native scrollbar inside the app's cropped iframe view. Real
    // visitors reading the page directly are unaffected - for them window.top === window.self.
    if (window.self !== window.top) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    }
  }, [])

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
    <div className='fixed bottom-0 right-0 z-50 bg-[#121316]'>
      <ins
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='1265004536'
        style={{ display: 'block', width: '300px', height: '250px' }}
      />
    </div>
  )
}
