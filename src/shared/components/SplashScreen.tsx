import type { ReactNode } from 'react'
import { cn } from '@heroui/react'
import { Unbounded } from 'next/font/google'

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
})

interface SplashScreenProps {
  children: ReactNode
  className?: string
}

// Shared full-viewport shell (background video + Unbounded wordmark) behind both FullscreenLoader
// (app-launch splash) and UpdateLoader (in-app-update splash) - the same visual identity `main`
// used for both screens. Extracted once UpdateLoader became a second real consumer, rather than
// copy-pasting the video/wordmark markup a second time (the same call already made for `AuthCard`).
// `main`'s `bg-base`/`text-content` theme tokens don't exist in this codebase's dark-only palette
// (see src/styles/theme.css), so plain black/white is used directly - visually identical anyway,
// since those tokens resolved to pure black/white on `main`'s default theme too.
export const SplashScreen = ({ children, className }: SplashScreenProps) => {
  return (
    <div className={cn('fixed inset-0 z-9998 h-screen w-screen bg-black', className)}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className='absolute inset-0 h-screen w-screen object-cover'
        src='/loader.webm'
      />
      <div className='absolute inset-0 z-10 flex flex-col items-center justify-center space-y-10'>
        <p className={`${unbounded.className} text-4xl font-black uppercase text-white`}>
          Steam Game Idler
        </p>
        {children}
      </div>
    </div>
  )
}
