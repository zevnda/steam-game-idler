'use client'

import { useEffect, useRef } from 'react'

interface AdOverlayTwoProps {
  className?: string
}

declare global {
  interface Window {
    ezstandalone: {
      cmd: (() => void)[]
      showAds: (...args: unknown[]) => void
    }
  }
}

export default function AdOverlayTwo({ className = '' }: AdOverlayTwoProps) {
  const pushed = useRef(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      window.ezstandalone = window.ezstandalone || { cmd: [] }
      window.ezstandalone.cmd.push(function () {
        window.ezstandalone.showAds({ anchor: anchorRef.current })
      })
    } catch (err) {
      console.error('Ezoic error:', err)
    }
  }, [])

  return (
    <div
      className={`ad-wrapper container mx-auto my-8 max-w-5xl px-4 sm:px-6 md:px-8 ${className}`}
    >
      <span className='mb-1 text-xs text-text-secondary'>Advertisement</span>
      <div ref={anchorRef} />
    </div>
  )
}
