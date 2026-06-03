import type React from 'react'

export default function CardBorder() {
  return (
    <div
      className='absolute inset-0 pointer-events-none'
      style={
        {
          zIndex: 10,
          borderRadius: 'var(--radius-card)',
          padding: '1px',
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 20%, transparent 52%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        } as React.CSSProperties
      }
      aria-hidden='true'
    />
  )
}
