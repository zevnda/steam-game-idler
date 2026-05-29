'use client'

import { useEffect, useRef, useState } from 'react'
import { FaStar } from 'react-icons/fa6'
import { FiDownload, FiGlobe, FiStar } from 'react-icons/fi'
import { TbCode } from 'react-icons/tb'
import SpotlightCard from '@docs/components/home/SpotlightCard'
import { ease } from '@docs/lib/motion'
import { useGlobalStore } from '@docs/stores/globalStore'
import { motion, useInView } from 'motion/react'

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function Counter({ target, suffix = '' }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isInView) return
    const duration = 1800
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.round(target * easeInOut(progress)))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [isInView, target])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

function TestimonialCard({ quote }: { quote: string }) {
  return (
    <SpotlightCard className='h-full'>
      <div className='flex flex-col h-full p-6'>
        <p className='text-text-primary text-sm leading-relaxed flex-1 mb-5'>{quote}</p>
        <div className='flex items-center justify-between'>
          <div className='flex gap-0.5'>
            {[1, 2, 3, 4, 5].map(n => (
              <FaStar key={n} className='w-3 h-3 text-amber-400' />
            ))}
          </div>
        </div>
        <div
          className='absolute bottom-2 right-2 text-9xl text-white/4 leading-none select-none pointer-events-none'
          aria-hidden='true'
        >
          &rdquo;
        </div>
      </div>
    </SpotlightCard>
  )
}

const testimonials = [
  'Farmed 500+ cards in just 2 days',
  "Best idler I've ever used — so simple!",
  'Open source and completely safe to use',
  'Earned $50+ from card sales this month',
  'Works perfectly across all my Steam games',
  'Set it and forget it — works like magic',
  'Zero configuration needed to get started',
  'Finally hit 100% on all my achievements',
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export default function StatsSection() {
  const { repoStars } = useGlobalStore(state => state)

  const stats = [
    {
      value: <Counter target={100} suffix='K+' />,
      label: 'Downloads',
      description: 'Active installations worldwide',
      icon: <FiDownload className='w-4 h-4' />,
      accent: 'bg-sky-400/70',
      iconColor: 'text-sky-400',
    },
    {
      value: <Counter target={150} suffix='K+' />,
      label: 'Supported Games',
      description: 'Compatible with your entire library',
      icon: <FiGlobe className='w-4 h-4' />,
      accent: 'bg-teal-400/70',
      iconColor: 'text-teal-400',
    },
    {
      value:
        repoStars !== null ? (
          <Counter target={repoStars} suffix='' />
        ) : (
          <span className='opacity-40'>…</span>
        ),
      label: 'GitHub Stars',
      description: 'Community-backed open source project',
      icon: <FiStar className='w-4 h-4' />,
      accent: 'bg-amber-400/70',
      iconColor: 'text-amber-400',
    },
    {
      value: <Counter target={100} suffix='%' />,
      label: 'Open Source',
      description: 'No hidden code, no secrets',
      icon: <TbCode className='w-4 h-4' />,
      accent: 'bg-violet-400/70',
      iconColor: 'text-violet-400',
    },
  ]

  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  const gridRef = useRef<HTMLDivElement>(null)
  const gridInView = useInView(gridRef, { once: true, margin: '-60px' })

  return (
    <section className='py-20 sm:py-24 lg:py-32 relative' aria-labelledby='stats-heading'>
      <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
        <motion.div
          ref={headerRef}
          className='max-w-2xl mx-auto text-center mb-16 sm:mb-20'
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
        >
          <h2
            id='stats-heading'
            className='text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-4 leading-tight tracking-tight'
          >
            Trusted by the <span className='gradient-text'>Steam community</span>
          </h2>
          <p className='text-lg text-text-muted leading-relaxed'>
            Hundreds of thousands of Steam users rely on SGI every day to automate their library.
          </p>
        </motion.div>

        <motion.div
          ref={gridRef}
          className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5'
          variants={container}
          initial='hidden'
          animate={gridInView ? 'show' : 'hidden'}
        >
          {stats.map(stat => (
            <motion.article key={stat.label} variants={cardVariant}>
              <div className='relative rounded-(--radius-card) bg-surface border border-white/6 overflow-hidden p-6 sm:p-8'>
                <div className={`absolute inset-x-0 top-0 h-0.5 ${stat.accent}`} />

                <div className='flex items-end justify-between mb-3'>
                  <div
                    className='text-3xl sm:text-4xl font-bold text-text-primary tabular-nums leading-none'
                    aria-label={`${stat.label} statistic`}
                  >
                    {stat.value}
                  </div>
                  <div className={stat.iconColor}>{stat.icon}</div>
                </div>

                <div className='text-xs text-text-muted uppercase tracking-widest font-medium mb-3'>
                  {stat.label}
                </div>

                <p className='text-sm text-text-muted leading-relaxed'>{stat.description}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>

      <div
        className='testimonials-container w-full overflow-hidden mt-16 sm:mt-20'
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      >
        <div className='testimonials-track flex items-stretch gap-5 w-max'>
          {testimonials.map(quote => (
            <div key={quote} className='w-72 shrink-0'>
              <TestimonialCard quote={quote} />
            </div>
          ))}
          {testimonials.map(quote => (
            <div key={`dup-${quote}`} aria-hidden='true' className='w-72 shrink-0'>
              <TestimonialCard quote={quote} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
