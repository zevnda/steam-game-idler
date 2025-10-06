'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

const FloatingAd = () => {
  const [adKey, setAdKey] = useState(0)

  useEffect(() => {
    const loadAd = () => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (err) {
        console.error('AdSense error:', err)
      }
    }

    loadAd()

    const getRandomInterval = () => Math.floor(Math.random() * (360000 - 240000 + 1)) + 240000

    const scheduleNextRefresh = () => {
      const interval = setTimeout(() => {
        setAdKey(prev => prev + 1)
        scheduleNextRefresh()
      }, getRandomInterval())

      return interval
    }

    const timeoutId = scheduleNextRefresh()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [adKey])

  return (
    <div className='fixed bottom-0 right-0 z-50 bg-[#121316]'>
      <ins
        key={adKey}
        className='adsbygoogle'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='9100790437'
        data-full-width-responsive='true'
        style={{ display: 'block', width: '300px', height: '250px' }}
      />
    </div>
  )
}

export default function AdComponents() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8915288433444527'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onerror = () => {
      console.warn('AdSense script failed to load')
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return <FloatingAd />
}
