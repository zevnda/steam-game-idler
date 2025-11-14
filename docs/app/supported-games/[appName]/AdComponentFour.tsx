'use client'

import type { ReactElement } from 'react'

import { useEffect, useRef, useState } from 'react'

export default function AdComponentFour(): ReactElement {
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
          'key' : '68b7a3fcb25a8c00273bc633cce8a0ae',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `
      const invokeScript = document.createElement('script')
      invokeScript.type = 'text/javascript'
      invokeScript.src = '//www.highperformanceformat.com/68b7a3fcb25a8c00273bc633cce8a0ae/invoke.js'
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
    <div className='fixed top-0 right-0 z-40 bg-[#121316]'>
      <div ref={adRef} key={adKey} style={{ width: 728, height: 90 }} />
    </div>
  )
}
