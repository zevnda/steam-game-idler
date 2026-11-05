import type { ReactNode } from 'react'
import { cn } from '@heroui/react'
import { Unbounded } from 'next/font/google'
import { SplashBackdrop, SplashGlow, SplashMark } from '@/shared/components/SplashScene'

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
})

interface SplashScreenProps {
  // Whatever sits under the wordmark (the update loader's progress bar); the launch loader has none.
  children?: ReactNode
  className?: string
}

// Shared full-viewport shell (animated backdrop + Unbounded wordmark) behind both FullscreenLoader
// (app-launch splash) and UpdateLoader (in-app-update splash) - the same visual identity `main`
// used for both screens. Extracted once UpdateLoader became a second real consumer, rather than
// copy-pasting the backdrop/wordmark markup a second time (the same call already made for
// `AuthCard`). The backdrop and logo mark are SplashScene.tsx's, drawn live with CSS - they replaced
// a looping `loader.webm` video.
// `main`'s `bg-base`/`text-content` theme tokens don't exist in this codebase's dark-only palette
// (see src/styles/theme.css), so plain black/white is used directly - visually identical anyway,
// since those tokens resolved to pure black/white on `main`'s default theme too.
export const SplashScreen = ({ children, className }: SplashScreenProps) => {
  return (
    <div className={cn('fixed inset-0 z-9998 h-screen w-screen bg-black', className)}>
      <SplashBackdrop />
      <div className='absolute inset-0 z-10 flex flex-col items-center justify-center space-y-10'>
        <div className='relative flex flex-col items-center gap-6'>
          <SplashGlow />
          <SplashMark />
          <p className={`${unbounded.className} relative text-4xl font-black uppercase text-white`}>
            Steam Game Idler
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
