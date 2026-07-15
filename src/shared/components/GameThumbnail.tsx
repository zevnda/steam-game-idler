import type { ReactNode } from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { Logo } from '@/shared/components/dashboard/Logo'

interface GameThumbnailProps {
  appId: number
  name: string
  // Overlay content (timer badges, etc.) rendered as a sibling inside this component's
  // `relative` wrapper, so callers don't need to manage their own positioning context.
  children?: ReactNode
}

// Header-image-with-fallback shell shared by every game card - extracted once a second feature
// (idling) needed the exact same image/fallback logic games-list's GameCard already had, mirroring
// the AuthCard precedent.
//
// The hover ring below ports `main`'s GameCard hover effect verbatim: an inset ring drawn only
// around the image (not the name/buttons below it), even though hovering anywhere on the card
// triggers it - `main` achieves that by putting `group` on the outer card wrapper and this inset
// shadow's `group-hover` inside the thumbnail only. Relies on an ancestor `.group` (every grid-
// style card wrapper sets it); harmlessly inert wherever GameThumbnail is used without one (the
// search modal's result rows, the settings game picker).
export const GameThumbnail = ({ appId, name, children }: GameThumbnailProps) => {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className='relative aspect-460/215 overflow-hidden rounded-lg bg-surface'>
      <div className='pointer-events-none absolute inset-0 z-10 rounded-lg opacity-0 ring-2 ring-inset ring-accent transition-opacity duration-150 group-hover:opacity-100' />
      {imageFailed ? (
        <div className='relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br from-surface-secondary via-surface to-surface'>
          {/* Off-center glow + a faint diagonal hatch give the placeholder some depth instead of a
              flat fill - purely decorative, no semantic meaning to the pattern itself. */}
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,color-mix(in_oklch,var(--surface-tertiary)_65%,transparent)_0%,transparent_65%)]' />
          <div className='pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--foreground)_0,var(--foreground)_1px,transparent_1px,transparent_11px)] opacity-[0.05]' />
          <div className='relative flex size-11 items-center justify-center rounded-full border border-border/60 bg-surface-secondary/70 text-foreground/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'>
            <Logo className='opacity-45' height={20} width={20} />
          </div>
        </div>
      ) : (
        <Image
          fill
          alt={`${name} header image`}
          className='object-cover'
          sizes='(min-width: 1536px) 15vw, (min-width: 1024px) 20vw, 33vw'
          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`}
          onError={() => setImageFailed(true)}
        />
      )}
      {children}
    </div>
  )
}
