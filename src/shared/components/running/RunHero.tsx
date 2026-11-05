import type { HeroArt } from '@/shared/utils/heroArt'
import type { ReactNode } from 'react'
import { cn, Skeleton } from '@heroui/react'
import Image from 'next/image'
import { useHeroArt } from '@/shared/hooks/useHeroArt'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { headerImageUrl } from '@/shared/utils/heroArt'

// Art behind a running-screen banner. A game without wide hero art (older and smaller games mostly)
// gets its header image instead - every Steam game has one. In the big banner it's enlarged and
// blurred to fill the much wider space (the same trick GamePosterArt uses for a game with no
// portrait art), with a sharp copy beside the name; a small card is close enough to the header's
// own shape to show it sharp, as is. `blur` on an image is fine on WebKitGTK; only a filtered
// <video> breaks there (see CLAUDE.md).
const HeroBackdrop = ({
  appId,
  art,
  size,
}: {
  appId: number
  art: HeroArt | null | undefined
  size: 'lg' | 'sm'
}) => {
  if (art === undefined) return <Skeleton className='absolute inset-0 rounded-none' />
  if (art === null && size === 'sm') {
    return <Image fill alt='' aria-hidden className='object-cover' src={headerImageUrl(appId)} />
  }
  if (art === null) {
    return (
      <Image
        fill
        alt=''
        aria-hidden
        className='scale-110 object-cover blur-2xl brightness-[.55] saturate-125'
        src={headerImageUrl(appId)}
      />
    )
  }
  return <Image fill alt='' aria-hidden className='object-cover' src={art.hero} />
}

// The game's title: its logo when it has one, otherwise its name as large text. With no hero art,
// a sharp copy of the header image sits beside the name so the game is still recognisable at a
// glance.
const HeroTitle = ({
  appId,
  name,
  art,
  size,
}: {
  appId: number
  name: string
  art: HeroArt | null | undefined
  size: 'lg' | 'sm'
}) => {
  if (art?.logo) {
    return (
      <div
        className={cn(
          'relative w-full',
          size === 'lg' ? 'h-20 max-w-[60%] @max-3xl:h-14' : 'h-10 max-w-[80%]',
        )}
      >
        <Image
          fill
          alt={name}
          className='object-contain object-bottom-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]'
          src={art.logo}
        />
      </div>
    )
  }
  return (
    <div className='flex min-w-0 items-center gap-4'>
      {art === null && size === 'lg' && (
        <div className='relative aspect-460/215 w-44 shrink-0 overflow-hidden rounded-lg shadow-xl @max-3xl:hidden'>
          <Image fill alt='' aria-hidden className='object-cover' src={headerImageUrl(appId)} />
        </div>
      )}
      <span
        className={cn(
          'min-w-0 font-black tracking-tight text-balance drop-shadow-lg',
          size === 'lg' ? 'text-4xl @max-3xl:text-3xl' : 'line-clamp-2 text-lg leading-tight',
        )}
      >
        {name}
      </span>
    </div>
  )
}

interface RunHeroProps {
  appId: number
  name: string
  // Big bold label inside the art, in the same spot and style as the Games page's "Recommended"
  heading: string
  // Under the title: the feature's own progress for this game
  children?: ReactNode
  // Right-hand panel (the Achievement Unlocker's next unlock)
  side?: ReactNode
}

// The banner at the top of a running screen's Overview for the one game being worked on. Shares the
// Games page banner's look (wide art, the label inside it), so a running feature reads as part of
// the same app. Needs an `@container` ancestor: it gets shorter in a small window.
export const RunHero = ({ appId, name, heading, children, side }: RunHeroProps) => {
  const art = useHeroArt(appId)
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  return (
    // The Games page banner's ambient glow: a blurred, faded copy of the art behind the banner,
    // spilling out around it (RecommendedBanner.tsx). Skipped on the slow WebKitGTK builds, like
    // there. The banner itself is the inner box, which clips its own content.
    <div className='relative h-78 shrink-0 @max-3xl:h-64'>
      {!forceReducedMotion && art !== undefined && (
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 scale-[1.03] opacity-40 blur-[60px] brightness-75 saturate-125'
        >
          <Image fill alt='' className='object-cover' src={art?.hero ?? headerImageUrl(appId)} />
        </div>
      )}
      <div className='relative size-full overflow-hidden rounded-2xl border border-white/10 bg-surface'>
        <HeroBackdrop appId={appId} art={art} size='lg' />
        <div
          aria-hidden
          className='absolute inset-0 bg-[linear-gradient(90deg,rgb(11_12_14/.95)_0%,rgb(11_12_14/.7)_42%,rgb(11_12_14/.1)_78%,transparent),linear-gradient(to_top,rgb(11_12_14/.9),transparent_55%)]'
        />
        <h2 className='absolute left-7 top-6 text-3xl font-black tracking-tight text-white drop-shadow-md @max-3xl:text-2xl'>
          {heading}
        </h2>
        <div className='absolute inset-0 flex items-end gap-6 p-7 text-white'>
          <div className='flex min-w-0 flex-1 flex-col gap-4'>
            <HeroTitle appId={appId} art={art} name={name} size='lg' />
            {children}
          </div>
          {side}
        </div>
      </div>
    </div>
  )
}

interface RunHeroCardProps {
  appId: number
  name: string
  children?: ReactNode
  // Corner marker, e.g. the game's colour dot when several run at once
  marker?: ReactNode
  // e.g. `rounded-none` when it sits flush inside a larger card
  className?: string
}

// A smaller banner for one of several games running at once - laid out in a grid in place of the
// single RunHero.
export const RunHeroCard = ({ appId, name, children, marker, className }: RunHeroCardProps) => {
  const art = useHeroArt(appId)
  return (
    <div className={cn('relative h-48 overflow-hidden rounded-2xl bg-surface', className)}>
      <HeroBackdrop appId={appId} art={art} size='sm' />
      <div
        aria-hidden
        className='absolute inset-0 bg-[linear-gradient(to_top,rgb(11_12_14/.95)_25%,rgb(11_12_14/.2))]'
      />
      {marker && <div className='absolute right-3 top-3'>{marker}</div>}
      <div className='absolute inset-0 flex flex-col justify-end gap-3 p-4 text-white'>
        <HeroTitle appId={appId} art={art} name={name} size='sm' />
        {children}
      </div>
    </div>
  )
}
