import { useEffect, useState } from 'react'
import { cn, Spinner } from '@heroui/react'
import { SplashScreen } from '@/shared/components/SplashScreen'

const FADE_MS = 250

interface FullscreenLoaderProps {
  visible: boolean
}

// App-launch splash screen - see SplashScreen for the shared shell (video + wordmark) this and
// UpdateLoader both compose. Unlike `main`, this owns its own fade-out/unmount timing internally
// off a single `visible` prop instead of a global loaderStore that other features (there, useInit
// and useCheckForUpdates) both raced to mutate. A caller just flips `visible` off once its real
// work is done; nothing else needs to coordinate.
export const FullscreenLoader = ({ visible }: FullscreenLoaderProps) => {
  const [shouldRender, setShouldRender] = useState(visible)
  const [fadeOut, setFadeOut] = useState(!visible)

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      setFadeOut(false)
      return
    }

    setFadeOut(true)
    const timeout = setTimeout(() => setShouldRender(false), FADE_MS)
    return () => clearTimeout(timeout)
  }, [visible])

  if (!shouldRender) return null

  return (
    <SplashScreen
      className={cn('transition-opacity duration-250', {
        'pointer-events-none opacity-0': fadeOut,
        'opacity-100': !fadeOut,
      })}
    >
      <Spinner className='text-white' color='current' size='lg' />
    </SplashScreen>
  )
}
