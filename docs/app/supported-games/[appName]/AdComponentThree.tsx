'use client'

import type { ReactElement } from 'react'

import { useEffect } from 'react'

export default function AdComponentThree(): ReactElement {
  useEffect(() => {
    const container = document.getElementById('hilltop-container')
    const script = document.createElement('script')
    script.innerHTML = `
      (function(acn){
      var d = document,
        s = d.createElement('script'),
        l = d.scripts[d.scripts.length - 1];
      s.settings = acn || {};
      s.src = "\/\/excitableminor.com\/bwXfVss.dYG-la0\/YXWVcm\/_eimS9QuOZrUNlvkNPxTlYT3bMsD\/Qow\/MUD\/QstYN-jrcpw\/NrDFAAwgN\/QG";
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      l.parentNode.insertBefore(s, l);
      })({})
    `
    container.appendChild(script)
  }, [])

  return <div id='hilltop-container' className='fixed bottom-0 left-0 z-40 bg-[#121316]' />
}
