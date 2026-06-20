import { motion } from 'framer-motion'
import Image from 'next/image'

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
]

export function ShootingStar({
  top,
  left,
  width,
  angle,
  delay,
  duration,
  repeatDelay,
  travel,
}: (typeof SHOOTING_STARS)[0]) {
  const rad = (angle * Math.PI) / 180
  const dx = travel * Math.cos(rad)
  const dy = travel * Math.sin(rad)

  return (
    <motion.div
      className='absolute pointer-events-none'
      style={{
        top,
        left,
        height: 1.5,
        width,
        borderRadius: 9999,
        background:
          'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.88) 85%, white 100%)',
        rotate: angle,
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.75))',
      }}
      animate={{ x: [0, dx], y: [0, dy], opacity: [0, 1, 0] }}
      transition={{ duration, repeat: Infinity, repeatDelay, delay, ease: 'easeOut' as const }}
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

// ─── Twinkling stars ──────────────────────────────────────────────────────────

export const TWINKLE_STARS = [
  {
    top: '10%',
    left: '14%',
    size: 2.5,
    color: '#cfe3ff',
    duration: 2.6,
    delay: 0.2,
    repeatDelay: 4.5,
  },
  {
    top: '6%',
    left: '62%',
    size: 2,
    color: '#ffe9c2',
    duration: 3.2,
    delay: 1.4,
    repeatDelay: 5.5,
  },
  {
    top: '18%',
    left: '85%',
    size: 1.8,
    color: '#ffffff',
    duration: 2.4,
    delay: 2.6,
    repeatDelay: 3.8,
  },
  {
    top: '28%',
    left: '38%',
    size: 2.2,
    color: '#ffd9b3',
    duration: 3.0,
    delay: 0.8,
    repeatDelay: 6.0,
  },
  {
    top: '34%',
    left: '8%',
    size: 1.6,
    color: '#ffffff',
    duration: 2.8,
    delay: 3.5,
    repeatDelay: 4.2,
  },
  {
    top: '40%',
    left: '92%',
    size: 2.4,
    color: '#cfe3ff',
    duration: 2.5,
    delay: 1.0,
    repeatDelay: 5.0,
  },
  {
    top: '48%',
    left: '22%',
    size: 1.8,
    color: '#ffc9d6',
    duration: 3.4,
    delay: 2.0,
    repeatDelay: 6.5,
  },
  {
    top: '55%',
    left: '70%',
    size: 2,
    color: '#ffffff',
    duration: 2.7,
    delay: 0.5,
    repeatDelay: 4.8,
  },
  {
    top: '62%',
    left: '46%',
    size: 2.2,
    color: '#ffe9c2',
    duration: 2.9,
    delay: 3.0,
    repeatDelay: 5.2,
  },
  {
    top: '68%',
    left: '12%',
    size: 1.6,
    color: '#cfe3ff',
    duration: 3.1,
    delay: 1.7,
    repeatDelay: 4.0,
  },
  {
    top: '72%',
    left: '80%',
    size: 2.4,
    color: '#ffffff',
    duration: 2.5,
    delay: 2.3,
    repeatDelay: 5.8,
  },
  {
    top: '76%',
    left: '58%',
    size: 1.8,
    color: '#ffd9b3',
    duration: 3.3,
    delay: 0.0,
    repeatDelay: 4.6,
  },
] as const

export function TwinkleStar({
  top,
  left,
  size,
  color,
  duration,
  delay,
  repeatDelay,
}: (typeof TWINKLE_STARS)[number]) {
  return (
    <motion.div
      className='absolute rounded-full pointer-events-none'
      style={{ top, left, width: size, height: size }}
      animate={{
        opacity: [0.3, 1, 0.3],
        backgroundColor: ['#ffffff', color, '#ffffff'],
        boxShadow: [`0 0 0px ${color}`, `0 0 5px ${color}`, `0 0 0px ${color}`],
      }}
      transition={{ duration, repeat: Infinity, repeatDelay, delay, ease: 'easeInOut' as const }}
    />
  )
}

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
    <motion.div
      className='absolute z-0 pointer-events-none select-none'
      style={style}
      animate={{ y: [0, -22, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' as const, delay }}
    >
      <Image
        src={src}
        alt=''
        width={size}
        height={size}
        className='object-contain opacity-90 drop-shadow-2xl'
      />
    </motion.div>
  )
}
