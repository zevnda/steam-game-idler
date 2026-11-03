import type { AnimationEvent, ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@heroui/react'
import { usePlatformStore } from '@/shared/stores/platformStore'

interface PageBodyProps {
  // Fill the rest of a flex-column parent (default), for content that manages its own scrolling.
  // False lets the body grow to its content, for a host that itself scrolls.
  fill?: boolean
  children: ReactNode
}

// Everything below a routed dashboard page's header or a settings category's title, playing a
// brief fade-and-rise when navigated to. The header is deliberately left outside it, so the title
// stays put while the content arrives. Being one element that stays mounted through a page's loading states, it
// plays once per navigation: a page that fetches first (card farming, inventory) rises with its
// skeleton, then swaps to real content in place rather than moving a second time.
//
// Two layers because a transform counts towards the scrollable overflow of the scroll container
// around it (`main`, or a settings panel): the 8px offset would flash its scrollbar on every
// navigation, and that scrollbar's width would reflow whichever grid is inside. The outer layer
// clips that overflow, but only while entering, since that container's scrolling has to keep
// working when a zoomed-in window can't fit the page.
// Dropping the animation class afterwards also removes the transform's stacking context and its
// containing block for `position: fixed` descendants.
export const PageBody = ({ fill = true, children }: PageBodyProps) => {
  const [isEntering, setIsEntering] = useState(true)
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  const shouldAnimate = isEntering && !forceReducedMotion

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // animationend bubbles, so ignore every animation running inside the page itself.
    if (event.target === event.currentTarget) setIsEntering(false)
  }

  return (
    <div className={cn(fill && 'min-h-0 flex-1', shouldAnimate && 'motion-safe:overflow-clip')}>
      <div
        className={cn('flex flex-col', fill && 'h-full', shouldAnimate && 'page-enter')}
        onAnimationEnd={handleAnimationEnd}
      >
        {children}
      </div>
    </div>
  )
}
