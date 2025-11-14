'use client'

import type { ReactElement } from 'react'

import { useEffect, useRef, useState } from 'react'

export default function AdComponentThree(): ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [adKey, setAdKey] = useState(0)

  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentDocument) {
      const doc = iframe.contentDocument
      doc.open()
      doc.write(`
        <html>
          <head></head>
          <body style="margin:0;padding:0;overflow:hidden;">
            <div id="ad-container"></div>
            <script type="text/javascript">
              atOptions = {
                'key' : '9e3ce85948245be365e8fe7b59943949',
                'format' : 'iframe',
                'height' : 600,
                'width' : 160,
                'params' : {}
              };
            <\/script>
            <script type="text/javascript" src="//www.highperformanceformat.com/9e3ce85948245be365e8fe7b59943949/invoke.js"><\/script>
          </body>
        </html>
      `)
      doc.close()
    }
    return () => {
      if (iframe) iframe.src = ''
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
      <iframe
        ref={iframeRef}
        key={adKey}
        style={{ width: 160, height: 600, border: 'none', overflow: 'hidden' }}
        width={160}
        height={600}
        sandbox='allow-scripts allow-same-origin'
        scrolling='no'
        title='ad-three'
      />
    </div>
  )
}
