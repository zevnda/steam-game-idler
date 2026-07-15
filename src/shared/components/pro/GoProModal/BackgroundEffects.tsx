import Image from 'next/image'

// Decorative starfield/shooting-stars/floating-image effects, ported from `main`
// (src/shared/components/pro/GoProModal/BackgroundEffects.tsx). `main` drove the shooting-star
// travel and floating-image bounce with framer-motion + a `useReducedMotion` early-return; this
// codebase dropped framer-motion, so both animations are
// plain CSS keyframes instead (`.pro-shooting-star`/`.pro-floating-image` in globals.css), driven
// per-instance via inline custom properties, with `@media (prefers-reduced-motion: reduce)`
// handling what the JS hook used to.

// ─── Shooting stars ──────────────────────────────────────────────────────────

export const SHOOTING_STARS = [
  {
    top: '4%',
    left: '6%',
    width: 140,
    angle: 30,
    delay: 0.0,
    duration: 0.85,
    repeatDelay: 5.0,
    travel: 220,
  },
  {
    top: '9%',
    left: '38%',
    width: 70,
    angle: 24,
    delay: 1.8,
    duration: 0.75,
    repeatDelay: 6.5,
    travel: 130,
  },
  {
    top: '12%',
    left: '55%',
    width: 90,
    angle: 26,
    delay: 2.5,
    duration: 1.0,
    repeatDelay: 6.0,
    travel: 170,
  },
  {
    top: '18%',
    left: '88%',
    width: 105,
    angle: 36,
    delay: 4.0,
    duration: 0.85,
    repeatDelay: 7.0,
    travel: 165,
  },
  {
    top: '24%',
    left: '2%',
    width: 115,
    angle: 34,
    delay: 5.5,
    duration: 0.9,
    repeatDelay: 6.0,
    travel: 195,
  },
  {
    top: '29%',
    left: '46%',
    width: 80,
    angle: 28,
    delay: 0.6,
    duration: 0.8,
    repeatDelay: 7.5,
    travel: 150,
  },
  {
    top: '34%',
    left: '76%',
    width: 82,
    angle: 32,
    delay: 7.0,
    duration: 0.8,
    repeatDelay: 8.0,
    travel: 155,
  },
  {
    top: '39%',
    left: '20%',
    width: 95,
    angle: 30,
    delay: 3.4,
    duration: 0.9,
    repeatDelay: 6.5,
    travel: 175,
  },
  {
    top: '44%',
    left: '65%',
    width: 75,
    angle: 28,
    delay: 1.2,
    duration: 1.1,
    repeatDelay: 7.5,
    travel: 145,
  },
  {
    top: '49%',
    left: '92%',
    width: 110,
    angle: 35,
    delay: 5.0,
    duration: 0.85,
    repeatDelay: 8.0,
    travel: 180,
  },
  {
    top: '54%',
    left: '32%',
    width: 100,
    angle: 22,
    delay: 4.2,
    duration: 0.95,
    repeatDelay: 6.5,
    travel: 185,
  },
  {
    top: '59%',
    left: '70%',
    width: 85,
    angle: 26,
    delay: 2.0,
    duration: 0.8,
    repeatDelay: 7.0,
    travel: 160,
  },
  {
    top: '64%',
    left: '8%',
    width: 95,
    angle: 30,
    delay: 3.0,
    duration: 0.9,
    repeatDelay: 6.0,
    travel: 175,
  },
  {
    top: '69%',
    left: '44%',
    width: 75,
    angle: 24,
    delay: 6.6,
    duration: 0.8,
    repeatDelay: 7.5,
    travel: 140,
  },
  {
    top: '74%',
    left: '58%',
    width: 120,
    angle: 26,
    delay: 6.2,
    duration: 1.0,
    repeatDelay: 6.0,
    travel: 200,
  },
] as const

export function ShootingStar({
  top,
  left,
  width,
  angle,
  delay,
  duration,
  repeatDelay,
  travel,
}: (typeof SHOOTING_STARS)[number]) {
  const rad = (angle * Math.PI) / 180
  const tx = travel * Math.cos(rad)
  const ty = travel * Math.sin(rad)

  return (
    <div
      className='pro-shooting-star absolute pointer-events-none'
      style={
        {
          top,
          left,
          width,
          'rotate': `${angle}deg`,
          '--pro-shooting-star-tx': `${tx}px`,
          '--pro-shooting-star-ty': `${ty}px`,
          'animationDuration': `${duration + repeatDelay}s`,
          'animationDelay': `${delay}s`,
        } as React.CSSProperties
      }
    />
  )
}

// ─── Starfield background ─────────────────────────────────────────────────────

function createStarfield(count: number, seed: number) {
  let state = seed
  const next = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const layers: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (next() * 100).toFixed(2)
    const y = (next() * 100).toFixed(2)
    const size = (0.5 + next() * 1.6).toFixed(2)
    const opacity = (0.25 + next() * 0.65).toFixed(2)
    layers.push(
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,${opacity}) 0, rgba(255,255,255,${opacity}) ${size}px, transparent ${size}px)`,
    )
  }
  return layers.join(', ')
}

export const STARFIELD_BACKGROUND = createStarfield(260, 1337)

// ─── Floating decorative images ──────────────────────────────────────────────

export function FloatingImage({
  src,
  size,
  duration,
  delay,
  style,
}: {
  src: string
  size: number
  duration: number
  delay: number
  style: React.CSSProperties
}) {
  return (
    <div
      className='pro-floating-image absolute z-0 pointer-events-none select-none'
      style={{ ...style, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      <Image src={src} alt='' width={size} height={size} className='object-contain opacity-90' />
    </div>
  )
}
