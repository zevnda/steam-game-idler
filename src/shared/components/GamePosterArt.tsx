import { useEffect, useState } from 'react'
import { cn } from '@heroui/react'
import Image from 'next/image'
import { GameArtPlaceholder } from '@/shared/components/GameArtPlaceholder'
import { requestGameArt, useGameArtStore } from '@/shared/stores/gameArtStore'

interface GamePosterArtProps {
  appId: number
  name: string
  // A known-good URL to show straight away, skipping the lookup, for art chosen ahead of time rather
  // than a game from someone's library. Falls back to the usual chain below if it ever stops loading.
  knownSrc?: string
}

const CDN_BASE = 'https://cdn.cloudflare.steamstatic.com/steam/apps'

// Fades in once loaded, and is remounted per URL (see `key` below) so that state starts fresh.
const ArtImage = ({
  src,
  name,
  className,
  onError,
}: {
  src: string
  name: string
  className: string
  onError?: () => void
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  return (
    <Image
      fill
      alt={name}
      className={cn(className, 'transition-opacity duration-150', !isLoaded && 'opacity-0')}
      src={src}
      onError={onError}
      onLoad={() => setIsLoaded(true)}
    />
  )
}

// Portrait art for a game, falling through each source that fails to load:
//   1. The URL from Steam's store API (see `game_art.rs` for why it can't just be guessed).
//   2. The guessable `library_600x900.jpg`, which a handful of games serve fine while the store API
//      returns nothing for them (delisted games, or when the lookup itself failed).
//   3. `header.jpg`, which is landscape, so it's shown whole over a blurred copy of itself rather
//      than cropped down to a sliver of the middle. It usually includes the game's logo.
//   4. A placeholder showing the game's name, since nothing else here would identify the game.
// Nothing renders until the lookup finishes, so a game with hashed art doesn't flash the wrong
// image or a failed request first.
export const GamePosterArt = ({ appId, name, knownSrc }: GamePosterArtProps) => {
  const [isKnownSrcBroken, setIsKnownSrcBroken] = useState(false)
  const shouldUseKnownSrc = knownSrc !== undefined && !isKnownSrcBroken
  const resolved = useGameArtStore(state => state.resolved[appId])
  const step = useGameArtStore(state => state.fallbackSteps[appId] ?? 0)
  const advanceFallback = useGameArtStore(state => state.advanceFallback)

  useEffect(() => {
    if (!shouldUseKnownSrc) requestGameArt(appId)
  }, [appId, shouldUseKnownSrc])

  if (shouldUseKnownSrc) {
    return (
      <ArtImage
        className='object-cover'
        name={name}
        src={knownSrc}
        onError={() => setIsKnownSrcBroken(true)}
      />
    )
  }

  if (resolved === undefined) return null

  const portraits = [resolved.portrait, `${CDN_BASE}/${appId}/library_600x900.jpg`].filter(
    (url): url is string => url !== null,
  )
  const portrait = portraits[step]
  if (portrait) {
    return (
      <ArtImage
        key={portrait}
        className='object-cover'
        name={name}
        src={portrait}
        onError={() => advanceFallback(appId)}
      />
    )
  }

  if (step === portraits.length) {
    const header = `${CDN_BASE}/${appId}/header.jpg`
    return (
      <>
        {/* Decorative copy behind the real image, so it stays out of the accessibility tree. */}
        <Image
          fill
          alt=''
          aria-hidden
          className='scale-125 object-cover opacity-60 blur-xl'
          src={header}
        />
        <ArtImage
          key={header}
          className='object-contain'
          name={name}
          src={header}
          onError={() => advanceFallback(appId)}
        />
      </>
    )
  }

  return (
    <GameArtPlaceholder>
      <span className='relative line-clamp-3 px-3 pt-3 text-center text-sm font-semibold text-foreground/80'>
        {name}
      </span>
    </GameArtPlaceholder>
  )
}
