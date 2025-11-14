'use client'

import type { ReactElement } from 'react'

import { useEffect, useRef, useState } from 'react'

export default function AdComponentTwo(): ReactElement {
  const adRef = useRef<HTMLDivElement>(null)
  const [adKey, setAdKey] = useState(0)

  useEffect(() => {
    const adContainer = adRef.current
    if (adContainer) {
      adContainer.innerHTML = ''
      const optionsScript = document.createElement('script')
      optionsScript.type = 'text/javascript'
      optionsScript.innerHTML = `
        atOptions = {
          'key' : '40116e815e38fb7afabae8c0ecb3a250',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `
      const invokeScript = document.createElement('script')
      invokeScript.type = 'text/javascript'
      invokeScript.src = '//www.highperformanceformat.com/40116e815e38fb7afabae8c0ecb3a250/invoke.js'
      adContainer.appendChild(optionsScript)
      adContainer.appendChild(invokeScript)
    }
    return () => {
      if (adContainer) adContainer.innerHTML = ''
    }
  }, [adKey])

  useEffect(() => {
    const interval = setInterval(
      () => {
        setAdKey(prev => prev + 1)
      },
      0.5 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [])

  return (
    <div className='fixed bottom-0 left-0 z-50 bg-[#121316]'>
      <div ref={adRef} key={adKey} style={{ width: 300, height: 250 }} />
    </div>
  )
}
