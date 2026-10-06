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
        alt=''
        width={1600}
        height={860}
        className='w-full h-auto block fallback-shot__img'
        loading='eager'
      />
    </div>
  )
}
