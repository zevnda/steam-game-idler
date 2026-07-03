'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FiArrowUpRight, FiTrendingUp } from 'react-icons/fi'
import { TbAward, TbBuildingStore, TbCards } from 'react-icons/tb'
import { AnimatePresence, motion, useInView } from 'motion/react'
import Link from 'next/link'
import { ease } from '@/app/lib/motion'

const features = [
  {
    icon: TbCards,
    color: 'text-blue-400',
    glow: '#60a5fa',
    title: 'Card Farming',
    description:
      'Collect trading card drops automatically from any game in your library. Runs quietly in the background while you focus on other things.',
    link: '/docs/features/card-farming',
    image: 'https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev/card-farming.png',
  },
  {
    icon: TbAward,
    color: 'text-purple-400',
    glow: '#c084fc',
    title: 'Achievement Manager',
    description:
      'View and manage achievements for any game you own. Unlock them manually or let the automated achievement unlocker handle it with human-like timing.',
    link: '/docs/features/achievement-manager',
    image: 'https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev/achievement-manager.png',
  },
  {
    icon: TbBuildingStore,
    color: 'text-emerald-400',
    glow: '#34d399',
    title: 'Inventory Manager',
    description:
      'Browse your entire Steam inventory and list items on the marketplace directly from within the app — no browser tabs required.',
    link: '/docs/features/inventory-manager',
    image: 'https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev/inventory-manager.png',
  },
  {
    icon: FiTrendingUp,
    color: 'text-orange-400',
    glow: '#fb923c',
    title: 'Playtime Booster',
    description:
      'Idle up to 32 games simultaneously to build playtime and meet card drop eligibility requirements faster.',
    link: '/docs/features/playtime-booster',
    image: 'https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev/playtime-booster.png',
  },
]

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState('Card Farming')
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const feature = features.find(f => f.title === activeFeature)!

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsAutoPlaying(true)
    intervalRef.current = setInterval(() => {
      setActiveFeature(current => {
        const idx = features.findIndex(f => f.title === current)
        return features[(idx + 1) % features.length].title
      })
    }, 7000)
  }, [])

  useEffect(() => {
    startInterval()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startInterval])

  const headerRef = useRef<HTMLElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  const bodyRef = useRef<HTMLDivElement>(null)
  const bodyInView = useInView(bodyRef, { once: true, margin: '-60px' })

  return (
    <section className='py-20 sm:py-24 lg:py-32 relative' aria-labelledby='features-heading'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-5xl'>
        <motion.header
          ref={headerRef}
          className='max-w-3xl mx-auto text-center mb-16 sm:mb-20'
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
        >
          <h2
            id='features-heading'
            className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-6 leading-tight tracking-tight'
          >
            Everything you <span className='gradient-text'>need,</span> <br />
            in a <span className='gradient-text'>single app</span>
          </h2>
          <p className='text-lg text-text-muted leading-relaxed'>
            Steam Game Idler combines the best features from all the popular Steam tools into a
            single, user-friendly app — actively maintained and completely free.
          </p>
        </motion.header>

        <motion.div
          ref={bodyRef}
          className='flex flex-col gap-4'
          initial={{ opacity: 0, y: 24 }}
          animate={bodyInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
        >
          {/* Feature selector tabs */}
          <nav aria-label='Feature categories' className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {features.map(f => {
              const isActive = activeFeature === f.title
              const Icon = f.icon
              return (
                <button
                  key={f.title}
                  onClick={() => {
                    setActiveFeature(f.title)
                    setIsAutoPlaying(false)
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current)
                      intervalRef.current = null
                    }
                  }}
                  className={`faq-tab${isActive ? ' faq-tab--active' : ''} cursor-pointer`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div className='faq-tab__content flex items-center gap-3 px-4 py-4'>
                    <div
                      className={`p-2 rounded-lg shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'bg-white/8 border border-white/15'
                          : 'bg-white/4 border border-white/8'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-colors duration-200 ${
                          isActive ? f.color : 'text-text-muted'
                        }`}
                      />
                    </div>
                    <span
                      className={`font-medium text-sm transition-colors duration-200 ${
                        isActive ? 'text-text-primary' : 'text-text-muted'
                      }`}
                    >
                      {f.title}
                    </span>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Feature image — HUD frame */}
          <div className='relative pt-4'>
            {/* Corner brackets */}
            <div
              className='absolute top-4 left-0 w-5 h-5 border-t border-l rounded-tl-lg pointer-events-none z-10'
              style={{ borderColor: feature.glow, transition: 'border-color 300ms ease' }}
            />
            <div
              className='absolute top-4 right-0 w-5 h-5 border-t border-r rounded-tr-lg pointer-events-none z-10'
              style={{ borderColor: feature.glow, transition: 'border-color 300ms ease' }}
            />
            <div
              className='absolute bottom-0 left-0 w-5 h-5 border-b border-l rounded-bl-lg pointer-events-none z-10'
              style={{ borderColor: feature.glow, transition: 'border-color 300ms ease' }}
            />
            <div
              className='absolute bottom-0 right-0 w-5 h-5 border-b border-r rounded-br-lg pointer-events-none z-10'
              style={{ borderColor: feature.glow, transition: 'border-color 300ms ease' }}
            />

            {/* Main frame */}
            <div className='relative border border-[#FFFFFF1A] overflow-hidden rounded-2xl'>
              {/* Header bar */}
              <div className='flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/3'>
                <div className='flex items-center gap-2'>
                  <span
                    className='w-2 h-2 rounded-full block shrink-0'
                    style={{ background: feature.glow, transition: 'background 300ms ease' }}
                  />
                  <span className='text-[10px] font-mono tracking-widest text-text-muted opacity-50 uppercase'>
                    preview
                  </span>
                </div>

                <AnimatePresence mode='wait'>
                  <motion.span
                    key={activeFeature + '-title'}
                    className='absolute left-1/2 -translate-x-1/2 text-xs text-text-muted'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {feature.title}
                  </motion.span>
                </AnimatePresence>

                {/* Pill indicators */}
                <div className='flex gap-1.5 items-center'>
                  {features.map(f => (
                    <motion.span
                      key={f.title}
                      className='block h-1.5 rounded-full'
                      animate={{
                        width: activeFeature === f.title ? 14 : 6,
                        backgroundColor:
                          activeFeature === f.title ? feature.glow : 'rgba(255,255,255,0.18)',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
              </div>

              {/* Screenshot */}
              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeFeature + '-img'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={feature.image}
                    alt={`${feature.title} screenshot`}
                    className='w-full h-auto block'
                  />
                </motion.div>
              </AnimatePresence>

              {/* Auto-play progress bar */}
              {isAutoPlaying && (
                <motion.div
                  key={`bar-${activeFeature}`}
                  className='h-px origin-left'
                  style={{ background: feature.glow, opacity: 0.5 }}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 7, ease: 'linear' }}
                />
              )}
            </div>
          </div>

          {/* Description + link */}
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeFeature + '-desc'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease }}
              className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6'
            >
              <p className='text-text-muted leading-relaxed max-w-xl'>{feature.description}</p>
              <Link
                prefetch={false}
                href={feature.link}
                className='btn-ghost px-3 py-1.5 text-xs gap-1 group shrink-0'
              >
                Read more
                <FiArrowUpRight className='w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150' />
              </Link>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
