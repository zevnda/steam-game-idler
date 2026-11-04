'use client'

import type { Ref } from 'react'
import type { FeatureId } from '../features'

// Real screenshots - shown only if WebGL is unavailable, so the showcase never has a hole. (Not
// shown while three.js loads: flashing a big static UI shot before the live one looked broken.)
// Positioned by Showcase.tsx on the same frame the 3D window would occupy. The Games shot is the
// current UI (1440x900, served from public/); the per-feature ones on the CDN predate the redesign.
const GAMES_SHOT = '/landing/sgi-games.webp'
const SHOTS: Record<FeatureId | 'hero', string> = {
  'hero': GAMES_SHOT,
  'games': GAMES_SHOT,
  'card-farming': 'https://cdn-steamgameidler.com/card-farming.webp',
  'achievement-unlocker': 'https://cdn-steamgameidler.com/achievement-manager.webp',
  'achievement-manager': 'https://cdn-steamgameidler.com/achievement-manager.webp',
  'playtime': 'https://cdn-steamgameidler.com/playtime-booster.webp',
  'inventory': 'https://cdn-steamgameidler.com/inventory-manager.webp',
  'free-games': GAMES_SHOT,
}

// Describes what each screenshot actually shows (several features share one), for image search.
// The wrapper stays aria-hidden: the live 3D window is the same content, so screen readers would
// otherwise hear it twice.
const SHOT_ALT: Record<string, string> = {
  [GAMES_SHOT]: "Steam Game Idler's Games page listing a Steam library of 1,019 games",
  'https://cdn-steamgameidler.com/card-farming.webp':
    'Card Farming in Steam Game Idler, idling 32 games with 90 card drops remaining',
  'https://cdn-steamgameidler.com/achievement-manager.webp':
    'Achievement Manager in Steam Game Idler, with an Unlock button for every achievement in a game',
  'https://cdn-steamgameidler.com/playtime-booster.webp':
    'Steam Game Idler boosting playtime hours on 30 games at once',
  'https://cdn-steamgameidler.com/inventory-manager.webp':
    'Inventory Manager in Steam Game Idler, listing Steam inventory items for sale on the Community Market',
}

interface FallbackShotProps {
  ref?: Ref<HTMLDivElement>
  visible: boolean
  /** per-feature screenshot once docked without WebGL; null = the hero shot */
  featureId: FeatureId | null
}

export default function FallbackShot({ ref, visible, featureId }: FallbackShotProps) {
  const key = featureId ?? 'hero'
  return (
    <div
      ref={ref}
      className={`fallback-shot absolute pointer-events-none transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden='true'
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={key}
        src={SHOTS[key]}
        alt={SHOT_ALT[SHOTS[key]]}
        width={SHOTS[key] === GAMES_SHOT ? 1440 : 1600}
        height={SHOTS[key] === GAMES_SHOT ? 900 : 860}
        className='w-full h-auto block fallback-shot__img'
        loading='eager'
      />
    </div>
  )
}
