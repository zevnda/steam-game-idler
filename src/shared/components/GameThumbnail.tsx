import type { ReactNode } from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { GameArtPlaceholder } from '@/shared/components/GameArtPlaceholder'

interface GameThumbnailProps {
  appId: number
  name: string
  // Overlay content (timer badges, etc.) rendered as a sibling inside this component's
  // `relative` wrapper, so callers don't need to manage their own positioning context.
  children?: ReactNode
}

// Landscape header image with a fallback, for the places a game is shown small or as a one-off rather
// than in a grid: the search modal's results, the settings game picker, and the achievement
// unlocker's current-game panel. Grid cards use `GamePosterCard` instead.
export const GameThumbnail = ({ appId, name, children }: GameThumbnailProps) => {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className='relative aspect-460/215 overflow-hidden rounded-lg bg-surface'>
      {imageFailed ? (
        <GameArtPlaceholder />
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
