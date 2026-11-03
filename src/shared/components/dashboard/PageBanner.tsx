import type { ReactNode } from 'react'
import { cn } from '@heroui/react'
import { CountChip } from '@/shared/components/dashboard/PageToolbar'
import { usePlatformStore } from '@/shared/stores/platformStore'

interface PageBannerProps {
  title: string
  description: string
  actions?: ReactNode
  // The right-hand illustration, positioned by the caller. Only shown once there's room for it (the
  // `@4xl:` breakpoint below), since it would otherwise overlap the text.
  art?: ReactNode
  // Content under the text, such as a form. The banner then grows to fit it rather than keeping the
  // usual fixed shape.
  children?: ReactNode
}

interface PageBannerAreaProps {
  // True when a floating PageToolbar sits above, which the banner has to start below.
  hasToolbar?: boolean
  children: ReactNode
}

// The scrolling space around a banner on an otherwise empty page. It clips at its edges, so its
// padding also has to leave room for the banner's rim glow to fade out fully.
export const PageBannerArea = ({ hasToolbar, children }: PageBannerAreaProps) => (
  <div
    className={cn(
      'min-h-0 flex-1 overflow-y-auto',
      hasToolbar ? 'page-banner-area-below-toolbar' : 'px-6 pb-6 pt-8',
    )}
  >
    {children}
  </div>
)

interface PageBannerPreviewProps {
  title: string
  count: number
  // Sits at the right of the panel's header, e.g. a section's stop button.
  action?: ReactNode
  // The game cards, three of them, laid out in the panel's grid.
  children: ReactNode
}

// The floating, tilted panel on a banner's right side: a miniature of the page with games on it,
// built from the app's real components rather than a static image. PageBanner makes its `art` inert,
// so nothing in here can be reached or clicked.
export const PageBannerPreview = ({ title, count, action, children }: PageBannerPreviewProps) => (
  <div className='perspective-[1400px]'>
    <div className='page-banner-float relative w-112'>
      <div className='relative flex transform-[rotateY(-14deg)_rotateX(5deg)] flex-col gap-3 rounded-2xl border border-white/15 bg-background/85 p-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.85)] backdrop-blur-md'>
        <div className='flex min-h-8 items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-sm font-semibold'>
            {title}
            <CountChip count={count} />
          </div>
          {action}
        </div>
        <div className='grid grid-cols-3 gap-3'>{children}</div>
      </div>
    </div>
  </div>
)

// A large banner standing in for a page with nothing to show, explaining why it's empty and what to
// do about it rather than leaving a line of text in an empty page. Wears the Go Pro card's turning
// rainbow rim and glow (globals.css `.page-banner`), so it reads as part of the same brand language.
export const PageBanner = ({ title, description, actions, art, children }: PageBannerProps) => {
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  const motionClassName = forceReducedMotion && 'force-reduced-motion'

  return (
    // The same shape and height limits as the Games page's Recommended banner (see GamesList.tsx's
    // BANNER_* constants), so every large banner in the app is one size.
    <div
      className={cn(
        '@container relative w-full',
        children ? 'min-h-85' : 'aspect-1920/620 max-h-105 min-h-85',
      )}
    >
      {/* A sibling behind the card, since the card clips its own overflow and would cut it off. */}
      <span aria-hidden='true' className={cn('page-banner-glow rounded-[22px]', motionClassName)} />
      <div
        className={cn(
          'page-banner relative flex h-full flex-col justify-center overflow-hidden rounded-[22px] p-10',
          motionClassName,
        )}
      >
        <div aria-hidden='true' className='page-banner-grid absolute inset-0' />
        <div
          aria-hidden='true'
          inert
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 hidden w-[53%] items-center justify-center @4xl:flex',
            motionClassName,
          )}
        >
          {art}
        </div>

        <div className='relative flex max-w-full flex-col items-start gap-6 @4xl:max-w-[47%]'>
          <h2 className='text-[40px] text-white font-black leading-[1.05] tracking-tight'>
            {title}
          </h2>
          <p className='text-sm leading-6 text-muted'>{description}</p>
          {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
          {children && <div className='w-full'>{children}</div>}
        </div>
      </div>
    </div>
  )
}
