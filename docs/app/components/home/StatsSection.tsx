'use client'

import { useEffect, useRef, useState } from 'react'
import { FiDownload, FiGlobe, FiStar } from 'react-icons/fi'
import { TbCode } from 'react-icons/tb'
import TestimonialsSlider from '@docs/components/home/TestimonialsSlider'
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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export default function StatsSection() {
  const { repoStars, totalDownloads } = useGlobalStore(state => state)

  const dlMatch = totalDownloads.match(/^(\d+(?:\.\d+)?)([A-Za-z+]*)$/)
  const dlTarget = dlMatch ? parseFloat(dlMatch[1]) : 0
  const dlSuffix = dlMatch ? dlMatch[2] : ''

  const stats = [
    {
      value:
        dlTarget > 0 ? (
          <Counter target={dlTarget} suffix={dlSuffix} />
        ) : (
          <span className='opacity-40'>…</span>
        ),
      label: 'Downloads',
      description: 'Active installations worldwide',
      icon: <FiDownload />,
      accent: 'bg-sky-400/70',
      iconColor: 'text-sky-400',
    },
    {
      value: <Counter target={150} suffix='K+' />,
      label: 'Supported Games',
      description: 'Compatible with your entire library',
      icon: <FiGlobe />,
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
      icon: <FiStar />,
      accent: 'bg-amber-400/70',
      iconColor: 'text-amber-400',
    },
    {
      value: <Counter target={100} suffix='%' />,
      label: 'Open Source',
      description: 'No hidden code, no secrets',
      icon: <TbCode />,
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
            className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-6 leading-tight tracking-tight'
          >
            Backed by a <span className='gradient-text'>community</span>
          </h2>
          <p className='text-lg text-text-muted leading-relaxed'>
            Join thousands of Steam users who automate their entire library with Steam Game Idler
            every day — for free.
          </p>
        </motion.div>

        <motion.div
          ref={gridRef}
          className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5'
          variants={container}
          initial='hidden'
          animate={gridInView ? 'show' : 'hidden'}
        >
          {stats.map(stat => (
            <motion.article key={stat.label} variants={cardVariant} className='h-full'>
              <div className='relative h-full rounded-(--radius-card) bg-surface border border-white/6 overflow-hidden p-4 sm:p-6 lg:p-8'>
                <div className={`absolute inset-x-0 top-0 h-0.5 ${stat.accent}`} />

                <div className='flex items-center justify-between mb-3'>
                  <div
                    className='text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tabular-nums leading-none'
                    aria-label={`${stat.label} statistic`}
                  >
                    {stat.value}
                  </div>
                  <div className={`${stat.iconColor} text-xl`}>{stat.icon}</div>
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

      <TestimonialsSlider />
    </section>
  )
}
