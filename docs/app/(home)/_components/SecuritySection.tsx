'use client'

import { useEffect, useRef, useState } from 'react'
import { FiCode, FiEye, FiRefreshCw } from 'react-icons/fi'
import { TbBrandGithub } from 'react-icons/tb'
import { motion, useInView } from 'motion/react'
import { ease } from '@/app/lib/motion'

const trustPoints = [
  {
    icon: <TbBrandGithub className='w-5 h-5' />,
    iconClass: 'text-text-muted bg-white/5 border-white/10',
    title: 'Fully Open Source',
    desc: 'Every line of code is public on GitHub. Fork it, audit it, build on it.',
  },
  {
    icon: <FiEye className='w-5 h-5' />,
    iconClass: 'text-text-muted bg-white/5 border-white/10',
    title: 'No Data Collection',
    desc: 'No analytics*, no telemetry*, no accounts. Your Steam credentials never leave your machine.',
  },
  {
    icon: <FiRefreshCw className='w-5 h-5' />,
    iconClass: 'text-text-muted bg-white/5 border-white/10',
    title: 'Actively Maintained',
    desc: 'Regular updates, security patches, and community-driven improvements.',
  },
]

const SEQUENCE = [
  { type: 'cmd', text: '$ sgi-audit --scan /proc/SteamGameIdler' },
  { type: 'log', text: 'Resolving binary hash...' },
  { type: 'pass', text: '✓ SHA-256 matches source commit a4e86538' },
  { type: 'cmd', text: '$ netstat --filter=SteamGameIdler' },
  { type: 'log', text: 'Monitoring network activity...' },
  { type: 'pass', text: '✓ 0 outbound connections*' },
  { type: 'pass', text: '✓ Zero telemetry endpoints detected*' },
  { type: 'cmd', text: '$ inspect --storage ~/.config/sgi/' },
  { type: 'log', text: 'Reading credential store...' },
  { type: 'pass', text: '✓ AES-256 encrypted via system keyring' },
  { type: 'pass', text: '✓ No plaintext secrets on disk' },
  { type: 'cmd', text: '$ verify --codesign SteamGameIdler.exe' },
  { type: 'log', text: 'Validating certificate chain...' },
  { type: 'pass', text: '✓ Signature valid — issuer: zevnda' },
  { type: 'result', text: '── AUDIT COMPLETE — SCORE: A+ ──' },
] as const

const DELAYS: Record<string, number> = {
  cmd: 700,
  log: 350,
  pass: 220,
  result: 450,
}

const CHAR_DELAY = 18

// text-xs leading-relaxed = 19.5px line height, space-y-1.5 = 6px gap → 25.5px per row
const LINE_HEIGHT = 25.5
// Keep 8 lines visible so the 9th line is fully in view before the translate starts
const MAX_VISIBLE = 8

interface VisibleLine {
  id: number
  type: string
  text: string
  chars: number
}

function SecurityTerminal({ active }: { active: boolean }) {
  const [lines, setLines] = useState<VisibleLine[]>([])
  const [lineIndex, setLineIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [done, setDone] = useState(false)

  // Step 1: wait for the inter-line delay, then add the next line
  useEffect(() => {
    if (!active || isTyping || done) return

    if (lineIndex < SEQUENCE.length) {
      const seq = SEQUENCE[lineIndex]
      const timer = setTimeout(() => {
        setLines(prev => [...prev, { id: lineIndex, type: seq.type, text: seq.text, chars: 0 }])
        setIsTyping(true)
      }, DELAYS[seq.type] ?? 400)
      return () => clearTimeout(timer)
    } else {
      setDone(true)
    }
  }, [lineIndex, active, isTyping, done])

  // Step 1b: reset after a pause when the sequence is complete
  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => {
      setLines([])
      setLineIndex(0)
      setDone(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [done])

  // Step 2: type out the last line one character at a time
  useEffect(() => {
    if (!isTyping || lines.length === 0) return

    const lastLine = lines[lines.length - 1]
    if (lastLine.chars < lastLine.text.length) {
      const timer = setTimeout(() => {
        setLines(prev => {
          const next = [...prev]
          next[next.length - 1] = {
            ...next[next.length - 1],
            chars: next[next.length - 1].chars + 1,
          }
          return next
        })
      }, CHAR_DELAY)
      return () => clearTimeout(timer)
    } else {
      setIsTyping(false)
      setLineIndex(i => i + 1)
    }
  }, [isTyping, lines])

  // Derived from lines.length — same render as the new line, so no clipping flash
  const offsetLines = Math.max(0, lines.length - MAX_VISIBLE)
  const translateY = offsetLines * LINE_HEIGHT

  return (
    <div
      className='h-56 overflow-hidden font-mono'
      aria-live='polite'
      aria-label='Live security audit log'
    >
      <div
        className='text-xs space-y-1.5 leading-relaxed'
        style={{
          transform: `translateY(-${translateY}px)`,
          transition: translateY > 0 ? 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
      >
        {lines.map((line, i) => {
          const isLast = i === lines.length - 1
          const color =
            line.type === 'cmd'
              ? 'text-text-primary'
              : line.type === 'pass'
                ? 'text-emerald-400'
                : line.type === 'result'
                  ? 'text-emerald-400 font-semibold tracking-wider'
                  : 'text-text-muted'

          return (
            <motion.div
              key={line.id}
              className={`flex items-baseline gap-1 ${color}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <span>{line.text.slice(0, line.chars)}</span>
              {isLast && !done && (
                <span className='inline-block w-1.5 h-3 bg-current opacity-80 animate-pulse' />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

const leftContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.13, delayChildren: 0.15 },
  },
}

const leftItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

const trustItem = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } },
}

export default function SecuritySection() {
  const leftRef = useRef<HTMLDivElement>(null)
  const leftInView = useInView(leftRef, { once: true, margin: '-60px' })

  const rightRef = useRef<HTMLDivElement>(null)
  const rightInView = useInView(rightRef, { once: true, margin: '-60px' })

  return (
    <section
      className='py-20 sm:py-24 lg:py-32 relative overflow-x-hidden'
      aria-labelledby='security-heading'
    >
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
          {/* Left — content */}
          <motion.div
            ref={leftRef}
            variants={leftContainer}
            initial='hidden'
            animate={leftInView ? 'show' : 'hidden'}
            className='space-y-0'
          >
            <motion.h2
              id='security-heading'
              variants={leftItem}
              className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-6 leading-tight tracking-tight'
            >
              Built with <span className='gradient-text'>transparency</span>
            </motion.h2>

            <motion.p variants={leftItem} className='text-lg text-text-muted mb-10 leading-relaxed'>
              Your data stays on your device. No cloud sync, no hidden requests, no surprises. Just
              a tool that does exactly what it says.
            </motion.p>

            <motion.div className='space-y-6' variants={leftContainer}>
              {trustPoints.map(point => (
                <motion.div
                  key={point.title}
                  className='flex items-start gap-4'
                  variants={trustItem}
                >
                  <div className={`p-2.5 rounded-xl border ${point.iconClass} shrink-0`}>
                    {point.icon}
                  </div>
                  <div>
                    <h3 className='font-semibold text-text-primary mb-1'>{point.title}</h3>
                    <p className='text-text-muted leading-relaxed'>{point.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — animated terminal */}
          <motion.div
            ref={rightRef}
            className='relative mt-8 lg:mt-0'
            initial={{ opacity: 0, x: 24 }}
            animate={rightInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
          >
            <div className='card p-6'>
              {/* Terminal header bar */}
              <div className='flex items-center gap-2 mb-5 pb-4 border-b border-border'>
                <div className='flex gap-1.5' aria-hidden='true'>
                  <div className='w-3 h-3 rounded-full bg-red-500/70' />
                  <div className='w-3 h-3 rounded-full bg-yellow-500/70' />
                  <div className='w-3 h-3 rounded-full bg-green-500/70' />
                </div>
                <div className='flex items-center gap-2 ml-2'>
                  <FiCode className='w-3.5 h-3.5 text-text-muted' aria-hidden='true' />
                  <span className='text-text-muted font-mono text-xs'>security-audit.log</span>
                </div>
                <div className='ml-auto flex items-center gap-1.5'>
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
                  <span className='text-emerald-400 font-mono text-xs'>live</span>
                </div>
              </div>

              <SecurityTerminal active={rightInView} />
            </div>

            {/* Floating badge */}
            <motion.div
              className='absolute -top-3 -right-3 bg-white/5 border border-white/15 text-text-muted px-3 py-1.5 rounded-lg font-semibold text-xs tracking-wide'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={rightInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.5, ease }}
            >
              VERIFIED SECURE
            </motion.div>

            <p className='text-xs text-text-muted mt-3 italic'>
              * excluding Steam, Google Ads & Vercel Analytics (the latter only applies when
              visiting this website)
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
