import type { CSSProperties } from 'react'
import { useEffect, useId, useState } from 'react'
import { cn } from '@heroui/react'
import { usePlatformStore } from '@/shared/stores/platformStore'

// SplashScreen's backdrop and logo mark: diagonal neon streaks drawn live (they replaced a looping
// `loader.webm` video of the same look, which was bundled into every build), plus the logo mark
// with a loading indicator around or inside it - the loader's only "still working" sign. The
// indicator is one of several, picked at random each time a splash appears.
//
// Kept cheap enough for the slow WebKitGTK builds: every moving part animates `translate`,
// `rotate`, `scale` or `opacity` only (composited, no repaint), and nothing uses CSS `filter`
// (see CLAUDE.md's WebKitGTK notes). Glow comes from static gradients and box-shadows instead.
// `forceReducedMotion` freezes it into a still frame apart from the orbiting ring, which is always
// the indicator shown there (see globals.css).
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
    </div>
  )
}

/**
 * The glow behind the mark and the wordmark, following their outline: a circle the size of the mark
 * over a pill as wide as the wordmark. Place it inside the box holding both, which it fills; its
 * layout copies that box's (SplashScreen's `gap-6` column) so each shape lines up with its element.
 */
export const SplashGlow = () => {
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true

  return (
    <div
      aria-hidden
      className={cn(
        'splash-scene splash-glow pointer-events-none absolute inset-0 flex flex-col items-center gap-6',
        forceReducedMotion && 'force-reduced-motion',
      )}
    >
      <div className='size-36 shrink-0 rounded-full' />
      <div className='w-full flex-1 rounded-full' />
    </div>
  )
}

// The loading indicators SplashMark picks between, one at random each time a splash appears
const MARK_VARIANTS = ['orbit', 'counter', 'chase', 'hex', 'gyro', 'liquid'] as const
type MarkVariant = (typeof MARK_VARIANTS)[number]

const TRACK = 'rgb(255 255 255 / 0.07)'

// 'counter': two arcs on nested tracks
const COUNTER_ARCS = [
  { id: 'counter-outer', r: 68, dash: '30 70', width: 2.5, duration: '2.6s', reverse: false },
  { id: 'counter-inner', r: 57, dash: '16 34', width: 2, duration: '4s', reverse: true },
]

// 'chase': a trail of dots, each a little smaller, fainter and later than the one before
const CHASE_DOTS = Array.from({ length: 8 }, (_, i) => ({
  id: `chase-${i}`,
  size: 9 - i,
  opacity: 1 - i * 0.11,
  color: COLORS[i % COLORS.length],
  delay: i * 0.07,
}))

// 'hex': the pointy-top hexagon the logo is cut from, as six separately lit edges
const HEX_POINTS = Array.from({ length: 6 }, (_, i) => {
  const angle = ((-90 + i * 60) * Math.PI) / 180
  return [72 + 68 * Math.cos(angle), 72 + 68 * Math.sin(angle)] as const
})
const HEX_EDGES = HEX_POINTS.map(([x1, y1], i) => {
  const [x2, y2] = HEX_POINTS[(i + 1) % 6]
  return { id: `hex-${i}`, x1, y1, x2, y2, color: COLORS[i % COLORS.length], delay: i * 0.18 }
})

// 'gyro': three rings tilted at different angles, each spinning at its own speed
const GYRO_RINGS = [
  { id: 'gyro-a', tilt: '0deg', color: '#46d9e8', duration: 2.4 },
  { id: 'gyro-b', tilt: '60deg', color: '#8b6bff', duration: 3 },
  { id: 'gyro-c', tilt: '-60deg', color: '#ff4fb4', duration: 3.6 },
]

// 'liquid': a sine wave wider than the logo, filled down past its bottom edge. One period is 64
// units, which is how far `splash-liquid-wave` slides it per loop, so the loop has no seam.
const WAVE = `M-256 0 ${'q16 -9 32 0 t32 0 '.repeat(12)}V320 H-256 Z`

interface RingProps {
  variant: Exclude<MarkVariant, 'liquid'>
  gradient: string
}

// The moving part around the logo, for every variant that keeps the logo itself still
const Ring = ({ variant, gradient }: RingProps) => {
  switch (variant) {
    // Two arcs turning opposite ways at different speeds
    case 'counter':
      return COUNTER_ARCS.map(arc => (
        <svg
          key={arc.id}
          className='splash-spin absolute inset-0'
          style={{
            animationDuration: arc.duration,
            animationDirection: arc.reverse ? 'reverse' : undefined,
          }}
          viewBox='0 0 144 144'
        >
          <circle cx='72' cy='72' fill='none' r={arc.r} stroke={TRACK} strokeWidth='1' />
          <circle
            cx='72'
            cy='72'
            fill='none'
            pathLength={100}
            r={arc.r}
            stroke={arc.reverse ? '#ff4fb4' : gradient}
            strokeDasharray={arc.dash}
            strokeLinecap='round'
            strokeWidth={arc.width}
          />
        </svg>
      ))
    // Dots that bunch up and stretch out as they lap the logo (each eases round on its own delay)
    case 'chase':
      return CHASE_DOTS.map(dot => (
        <div
          key={dot.id}
          className='splash-chase absolute inset-0'
          style={{ animationDelay: `${dot.delay}s` }}
        >
          <span
            className='absolute top-0 left-1/2 rounded-full'
            style={{
              width: dot.size,
              height: dot.size,
              translate: '-50% -50%',
              opacity: dot.opacity,
              background: dot.color,
              boxShadow: dot.size > 6 ? `0 0 10px ${dot.color}` : undefined,
            }}
          />
        </div>
      ))
    // The hexagon's edges lighting up one after another, so the light runs round it
    case 'hex':
      return (
        <svg className='absolute inset-0' viewBox='0 0 144 144'>
          {HEX_EDGES.map(edge => (
            <line
              key={edge.id}
              className='splash-hex-edge'
              stroke={edge.color}
              strokeLinecap='round'
              strokeWidth='2.5'
              style={{ animationDelay: `${edge.delay}s` }}
              x1={edge.x1}
              x2={edge.x2}
              y1={edge.y1}
              y2={edge.y2}
            />
          ))}
        </svg>
      )
    // Tilted rings spinning round the logo like a gyroscope
    case 'gyro':
      return GYRO_RINGS.map(ring => (
        <div
          key={ring.id}
          className='splash-gyro absolute inset-1 rounded-full border-2'
          style={
            {
              '--tilt': ring.tilt,
              'borderColor': TRACK,
              'borderTopColor': ring.color,
              'animationDuration': `${ring.duration}s`,
            } as CSSProperties
          }
        />
      ))
    // A slow gradient comet orbiting the logo
    default:
      return (
        <svg className='splash-orbit absolute inset-0' viewBox='0 0 144 144'>
          <circle cx='72' cy='72' fill='none' r='68' stroke={TRACK} strokeWidth='1' />
          <circle
            cx='72'
            cy='72'
            fill='none'
            pathLength={100}
            r='68'
            stroke={gradient}
            strokeDasharray='22 78'
            strokeLinecap='round'
            strokeWidth='2.5'
          />
        </svg>
      )
  }
}

/**
 * The logo mark plus a loading indicator, picked at random from MARK_VARIANTS each time it mounts.
 */
export const SplashMark = () => {
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  // per instance, since an SVG id is document-wide and two splashes can overlap mid-fade
  const gradientId = useId()
  const clipId = useId()
  const gradient = `url(#${gradientId})`

  // Picked after mount, not during render: the splash is in the statically exported HTML, so a
  // random pick while rendering would differ between that and the client's first render. Until then
  // the box stays empty - a single frame, while the logo would still be drawing on anyway.
  const [picked, setPicked] = useState<MarkVariant | null>(null)
  useEffect(() => {
    setPicked(MARK_VARIANTS[Math.floor(Math.random() * MARK_VARIANTS.length)])
  }, [])
  // The plain orbit on slow WebKitGTK builds: it's the one variant whose motion is a single cheap
  // rotation, which is why globals.css keeps it running when the rest of the splash is frozen.
  const variant = forceReducedMotion ? 'orbit' : picked

  return (
    <div
      aria-hidden
      className={cn(
        'splash-scene relative flex size-36 items-center justify-center',
        forceReducedMotion && 'force-reduced-motion',
      )}
    >
      <svg className='absolute size-0'>
        <defs>
          <linearGradient id={gradientId} x1='0' x2='1' y1='0' y2='1'>
            <stop offset='0' stopColor='#46d9e8' />
            <stop offset='0.5' stopColor='#8b6bff' />
            <stop offset='1' stopColor='#ff4fb4' />
          </linearGradient>
        </defs>
      </svg>
      {variant === 'liquid' && (
        // The logo itself is the indicator: it fills with a gradient liquid, a wave rolling across
        <svg height={92} viewBox='0 0 256 256' width={92}>
          <defs>
            <clipPath id={clipId}>
              <path d={LOGO_PATH} />
            </clipPath>
          </defs>
          <path d={LOGO_PATH} fill='rgb(255 255 255 / 0.08)' />
          <g clipPath={`url(#${clipId})`}>
            <g className='splash-liquid-level'>
              <path className='splash-liquid-wave' d={WAVE} fill={gradient} />
            </g>
          </g>
          <path
            d={LOGO_PATH}
            fill='none'
            stroke='rgb(255 255 255 / 0.55)'
            strokeLinejoin='round'
            strokeWidth='5'
          />
        </svg>
      )}
      {variant && variant !== 'liquid' && (
        <>
          <Ring gradient={gradient} variant={variant} />
          {/* draws its outline on, fills in over it, then settles into a slow breath */}
          <svg className='splash-logo relative' height={72} viewBox='0 0 256 256' width={72}>
            <path
              className='splash-logo-stroke'
              d={LOGO_PATH}
              fill='none'
              pathLength={1}
              stroke={gradient}
              strokeLinejoin='round'
              strokeWidth='6'
            />
            <path className='splash-logo-fill' d={LOGO_PATH} fill='#ffffff' />
          </svg>
        </>
      )}
    </div>
  )
}
