'use client'

import type { ReactElement } from 'react'

import { useEffect } from 'react'

export default function AdComponentThree(): ReactElement {
  useEffect(() => {
    const container = document.getElementById('hilltop-container')
    const script = document.createElement('script')
    script.innerHTML = `
      (function(ypw){
        var d = document,
            s = d.createElement('script'),
            l = document.getElementById('hilltop-container');
        s.settings = ypw || {};
        s.src = "//excitableminor.com/bhX.VdszdxGxlP0dYYWtcY/eetma9Vu/ZuUBlEk-PYTlYb3tMLDTQvwfMBDlASwPNWQR";
        s.async = true;
        s.referrerPolicy = 'no-referrer-when-downgrade';
        l.appendChild(s);
      })({})
    `
    container.appendChild(script)
  }, [])

  return <div id='hilltop-container' className='absolute top-0 right-0 z-40' />
}
