'use client'

import type { Ref } from 'react'
import type { FeatureId } from '../features'

// Real screenshots already on the CDN - shown only if WebGL is unavailable, so the showcase never
// has a hole. (Not shown while three.js loads: flashing a big static UI shot before the live one
// looked broken.) Positioned by Showcase.tsx on the same frame the 3D window would occupy.
const SHOTS: Record<FeatureId | 'hero', string> = {
  'hero': 'https://cdn-steamgameidler.com/example_v2.webp',
  'games': 'https://cdn-steamgameidler.com/example_v2.webp',
  'card-farming': 'https://cdn-steamgameidler.com/card-farming.webp',
  'achievement-unlocker': 'https://cdn-steamgameidler.com/achievement-manager.webp',
  'achievement-manager': 'https://cdn-steamgameidler.com/achievement-manager.webp',
  'playtime': 'https://cdn-steamgameidler.com/playtime-booster.webp',
  'inventory': 'https://cdn-steamgameidler.com/inventory-manager.webp',
  'free-games': 'https://cdn-steamgameidler.com/example_v2.webp',
}

// Describes what each screenshot actually shows (several features share one), for image search.
// The wrapper stays aria-hidden: the live 3D window is the same content, so screen readers would
// otherwise hear it twice.
const SHOT_ALT: Record<string, string> = {
  'https://cdn-steamgameidler.com/example_v2.webp':
    "Steam Game Idler's Games page listing a Steam library of 708 games",
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
        width={1600}
        height={860}
        className='w-full h-auto block fallback-shot__img'
        loading='eager'
      />
    </div>
  )
}
