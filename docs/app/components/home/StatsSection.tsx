'use client'

import { useEffect, useRef, useState } from 'react'
import { FaQuoteRight } from 'react-icons/fa6'
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

function TestimonialCard({
  content,
  username,
  platform,
}: {
  content: string
  username: string
  platform: string
}) {
  return (
    <SpotlightCard className='h-full'>
      <div className='flex flex-col h-full p-6'>
        <p className='text-text-primary text-sm leading-relaxed flex-1 mb-5'>{content}</p>
        <div className='flex items-center justify-end'>
          {/* <div className='flex gap-0.5'>
            {[1, 2, 3, 4, 5].map(n => (
              <FaStar key={n} className='w-3 h-3 text-amber-400' />
            ))}
          </div> */}
          <div className='flex flex-col items-end gap-0.5'>
            <span className='text-text-primary text-xs'>{username}</span>
            <span className='text-text-muted text-xs'>{platform}</span>
          </div>
        </div>
        <FaQuoteRight
          className='absolute bottom-3 left-3 w-16 h-16 text-white/4 select-none pointer-events-none'
          aria-hidden='true'
        />
      </div>
    </SpotlightCard>
  )
}

const testimonials = [
  {
    content:
      "All the other idlers cost more — monthly and yearly — while SGI is free and includes features that others either don't offer or lock behind paywalls.",
    username: 'Proxii',
    platform: 'Discord',
  },
  {
    content: "Just hopping in to say that @zevnda ... you are doing the lord's work!",
    username: 'DrSadistic',
    platform: 'Discord',
  },
  {
    content:
      'I am always looking forward to any and all new features being added. SGI is great btw.',
    username: 'Spectro',
    platform: 'Discord',
  },
  {
    content: 'I supported with PRO purely just to auto-claim free games.',
    username: 'Zayne',
    platform: 'Discord',
  },
  {
    content: "Thanks for this app — well done, it's brilliant work",
    username: 'B N Y',
    platform: 'Discord',
  },
  {
    content:
      'Thank you to all the developers (or just one) and contributors that have made SGI into a reality. SO many people appreciate what you guys do <3',
    username: '*✦bunnish',
    platform: 'Discord',
  },
  {
    content:
      'Steam Game Idler is perfect if you want to customize your profile or be that one person with thousands of hours on a joke game. Runs smoothly in the background. Simple, convenient, and works great.',
    username: 'dlyay',
    platform: 'Discord',
  },
  {
    content:
      'Switched from Idle Master Extended after it broke with newer titles, and I was always put off by the setup process of ArchiSteamFarm — I love your app, it looks really modern and is working for the newer games.',
    username: 'Deathwalker',
    platform: 'Discord',
  },
  {
    content:
      "Thank you so much! So far, I've found the Trading Card Manager to be very useful. Thank you for working on this all-in-one software. It's an amazing tool, all the better for being open source.",
    username: 'Raggart',
    platform: 'steamgifts.com',
  },
  {
    content:
      'I have 2,903 games and farmed 1,600 of them in 2 weeks — made around $150 from card sales and grabbed Stellar Blade Complete Edition for free. Better than nothing!',
    username: 'Mazewaliztli47',
    platform: 'steamgifts.com',
  },
  {
    content:
      'This is a great utility. It makes the nightmare of managing steam cards actually managable.',
    username: 'Nogift4u',
    platform: 'steamgifts.com',
  },
  {
    content:
      "Downloaded and idling cards with this for about 24 hours so far. I've used ASF in the past, but this is friendlier and I like it so far.",
    username: 'DrR0Ck',
    platform: 'steamgifts.com',
  },
  {
    content:
      'Thanks for the tool. Being able to simultaneously idle up to 32 games is great; only took a few days to get through all my remaining card drops.',
    username: 'BarbaricGenie',
    platform: 'steamgifts.com',
  },
  {
    content: 'Thank you very much! A very good alternative with a ton of useful features.',
    username: 'rashka',
    platform: 'steamgifts.com',
  },
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
  const { repoStars, totalDownloads } = useGlobalStore(state => state)
  const [shuffled] = useState(() => [...testimonials].sort(() => Math.random() - 0.5))

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
          {shuffled.map(t => (
            <div key={t.username} className='w-72 shrink-0'>
              <TestimonialCard content={t.content} username={t.username} platform={t.platform} />
            </div>
          ))}
          {shuffled.map(t => (
            <div key={`dup-${t.username}`} aria-hidden='true' className='w-72 shrink-0'>
              <TestimonialCard content={t.content} username={t.username} platform={t.platform} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
