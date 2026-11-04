import { useId } from 'react'
import { cn } from '@heroui/react'
import { usePlatformStore } from '@/shared/stores/platformStore'

// SplashScreen's backdrop and logo mark: diagonal neon streaks drawn live (they replaced a looping
// `loader.webm` video of the same look, which was bundled into every build), plus the mark drawing
// itself on inside an orbiting ring - the loader's only "still working" indicator.
//
// Kept cheap enough for the slow WebKitGTK builds: every moving part animates `translate`,
// `rotate`, `scale` or `opacity` only (composited, no repaint), and nothing uses CSS `filter`
// (see CLAUDE.md's WebKitGTK notes). Glow comes from static gradients and box-shadows instead.
// `forceReducedMotion` freezes it into a still frame apart from the orbiting ring (see globals.css).
// The OS reduced-motion setting is deliberately ignored, as the old video always did: this is the
// app's loading screen, on screen only briefly, and its motion is what shows the app is working.
//
// SplashScreen also shows during the version-policy check, which runs before usePlatform has
// resolved the platform store - `null` there means "not forced", so the very first launch frames
// animate even on a build that would later be flagged. Acceptable for a loader on screen this
// briefly.

const STREAK_COUNT = 36
const COLORS = ['#ff4fb4', '#46d9e8', '#8b6bff', '#ff3d8b', '#5ee8c8']

// Seeded rather than Math.random: the page is statically exported and hydrated, so the server and
// client renders must produce the identical field.
const seeded = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// The tilted field is wider than the window so it still covers the corners, which means a streak
// near either edge of it never crosses the view. Lanes are spread across just the visible band.
const VISIBLE_BAND = [11, 89] as const
const PER_LAYER = STREAK_COUNT / 3

// Three depth layers, like the video's out-of-focus streaks: far ones thin, dim and slow; near ones
// thick, bright, fast and glowing.
const STREAKS = Array.from({ length: STREAK_COUNT }, (_, i) => {
  const depth = i % 3
  const r = (k: number) => seeded(i * 7 + k)
  const color = COLORS[Math.floor(r(1) * COLORS.length)]
  // Stratified, not purely random: each layer gets one streak per equal-width lane, jittered inside
  // it and shifted by a third of a lane per layer so the layers don't line up. Plain random
  // placement over so few streaks bunched the big near ones on the left half of the window.
  const lane = (Math.floor(i / 3) + (depth + 0.15 + r(2) * 0.7) / 3) / PER_LAYER
  return {
    id: `streak-${i}`,
    left: `${(VISIBLE_BAND[0] + lane * (VISIBLE_BAND[1] - VISIBLE_BAND[0])).toFixed(2)}%`,
    width: [2, 3, 5][depth],
    height: Math.round([50, 90, 150][depth] * (0.6 + r(3) * 0.8)),
    duration: [9, 6, 3.6][depth] * (0.75 + r(4) * 0.5),
    // negative, so every streak is already mid-flight on the first frame
    delay: -r(5) * 9,
    opacity: [0.28, 0.55, 0.9][depth],
    color,
    glow: depth === 2,
  }
})

// Logo.tsx's mark
const LOGO_PATH =
  'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'

/** The streak field filling the window behind SplashScreen's content. */
export const SplashBackdrop = () => {
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true

  return (
    <div
      aria-hidden
      className={cn(
        'splash-scene pointer-events-none absolute inset-0 overflow-hidden',
        forceReducedMotion && 'force-reduced-motion',
      )}
    >
      <div className='splash-streaks absolute'>
        {STREAKS.map(s => (
          <span
            key={s.id}
            className='splash-streak absolute top-0 rounded-full'
            style={{
              left: s.left,
              width: s.width,
              height: s.height,
              opacity: s.opacity,
              background: `linear-gradient(to bottom, transparent, ${s.color})`,
              boxShadow: s.glow ? `0 0 14px 1px ${s.color}` : undefined,
              animationDuration: `${s.duration.toFixed(2)}s`,
              animationDelay: `${s.delay.toFixed(2)}s`,
            }}
          />
        ))}
      </div>
      {/* darkens the edges and the centre, so the mark and wordmark read over the streaks */}
      <div className='splash-vignette absolute inset-0' />
      <div className='splash-glow absolute top-1/2 left-1/2 rounded-full' />
    </div>
  )
}

/** The logo mark drawing itself on, with a slow gradient comet orbiting it. */
export const SplashMark = () => {
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  // per instance, since a gradient id is document-wide and two splashes can overlap mid-fade
  const gradientId = useId()

  return (
    <div
      aria-hidden
      className={cn(
        'splash-scene relative flex size-36 items-center justify-center',
        forceReducedMotion && 'force-reduced-motion',
      )}
    >
      <svg className='splash-orbit absolute inset-0' viewBox='0 0 144 144'>
        <defs>
          <linearGradient id={gradientId} x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0' stopColor='#46d9e8' />
            <stop offset='0.5' stopColor='#8b6bff' />
            <stop offset='1' stopColor='#ff4fb4' />
          </linearGradient>
        </defs>
        <circle
          cx='72'
          cy='72'
          r='68'
          fill='none'
          stroke='rgb(255 255 255 / 0.07)'
          strokeWidth='1'
        />
        <circle
          cx='72'
          cy='72'
          r='68'
          fill='none'
          pathLength={100}
          stroke={`url(#${gradientId})`}
          strokeDasharray='22 78'
          strokeLinecap='round'
          strokeWidth='2.5'
        />
      </svg>
      <svg className='splash-logo relative' height={72} viewBox='0 0 256 256' width={72}>
        <path
          className='splash-logo-stroke'
          d={LOGO_PATH}
          fill='none'
          pathLength={1}
          stroke={`url(#${gradientId})`}
          strokeLinejoin='round'
          strokeWidth='6'
        />
        <path className='splash-logo-fill' d={LOGO_PATH} fill='#ffffff' />
      </svg>
    </div>
  )
}
