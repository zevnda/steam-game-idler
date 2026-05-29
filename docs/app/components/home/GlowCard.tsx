'use client'

import { useCallback, useRef } from 'react'

interface GlowCardProps {
  children: React.ReactNode
  className?: string
}

export default function GlowCard({ children, className = '' }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - left) / width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - top) / height) * 100}%`)
  }, [])

  const handleMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '50%')
  }, [])

  return (
    <div
      ref={ref}
      className={`glow-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className='glow-card__content'>{children}</div>
    </div>
  )
}
