'use client'

import type { ReactElement } from 'react'

import { useEffect, useRef, useState } from 'react'

export default function AdComponentThree(): ReactElement {
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
          'key' : '9e3ce85948245be365e8fe7b59943949',
          'format' : 'iframe',
          'height' : 600,
          'width' : 160,
          'params' : {}
        };
      `
      const invokeScript = document.createElement('script')
      invokeScript.type = 'text/javascript'
      invokeScript.src = '//www.highperformanceformat.com/9e3ce85948245be365e8fe7b59943949/invoke.js'
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
    <div className='fixed top-0 left-0 z-40 bg-[#121316]'>
      <div ref={adRef} key={adKey} style={{ width: 160, height: 600 }} />
    </div>
  )
}
