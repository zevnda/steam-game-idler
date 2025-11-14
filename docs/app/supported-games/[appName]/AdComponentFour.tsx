'use client'

import type { ReactElement } from 'react'

import { useEffect, useRef, useState } from 'react'

export default function AdComponentFour(): ReactElement {
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
                'key' : '68b7a3fcb25a8c00273bc633cce8a0ae',
                'format' : 'iframe',
                'height' : 90,
                'width' : 728,
                'params' : {}
              };
            <\/script>
            <script type="text/javascript" src="//www.highperformanceformat.com/68b7a3fcb25a8c00273bc633cce8a0ae/invoke.js"><\/script>
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
    <div className='fixed top-0 right-0 z-40 bg-[#121316]'>
      <iframe
        ref={iframeRef}
        key={adKey}
        style={{ width: 728, height: 90, border: 'none', overflow: 'hidden' }}
        width={728}
        height={90}
        sandbox='allow-scripts allow-same-origin'
        scrolling='no'
        title='ad-four'
      />
    </div>
  )
}
