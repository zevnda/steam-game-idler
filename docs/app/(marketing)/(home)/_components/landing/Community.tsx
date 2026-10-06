'use client'

import { useEffect, useRef, useState } from 'react'
import { FaPause, FaPlay, FaQuoteLeft } from 'react-icons/fa6'
import SectionHeading from './SectionHeading'
import { TESTIMONIALS } from './testimonials'
import { useInView, useReducedMotion } from 'motion/react'
import { FadeIn } from '@/app/lib/animations'
import { useGlobalStore } from '@/app/lib/globalStore'

/**
 * Counts up from zero the first time it scrolls into view. Under reduced motion it just shows
 * the final number (gated on `inView`, which is false during hydration, so the server's "0" and
 * the client's first render still match).
 */
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView || !value || reduce) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1600)
      setN(Math.round(value * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, reduce])
  return (
    <span ref={ref} className='tabular-nums'>
      {(reduce && inView ? value : n).toLocaleString()}
      {suffix}
    </span>
  )
}

export default function Community() {
  const { totalDownloads, totalGames, repoStars } = useGlobalStore(s => s)
  // The wall scrolls on its own indefinitely, so it needs a real pause control (WCAG 2.2.2) -
  // hover/focus pausing alone leaves touch visitors with no way to stop it.
  const [paused, setPaused] = useState(false)
  // totalDownloads arrives pre-formatted (e.g. "192K") - split it so the number can still count up
  const dl = totalDownloads.match(/^(\d+(?:\.\d+)?)([A-Za-z+]*)$/)

  const stats = [
    {
      value: dl ? <CountUp value={parseFloat(dl[1])} suffix={dl[2]} /> : '100K+',
      label: 'Downloads',
    },
    // formatCount's own shape (e.g. "191K+"), counted up in thousands
    {
      value: <CountUp value={Math.floor(totalGames / 1000)} suffix='K+' />,
      label: 'Supported games',
    },
    { value: <CountUp value={repoStars} />, label: 'GitHub stars' },
    { value: <CountUp value={100} suffix='%' />, label: 'Free & public source' },
  ]

  // three columns of quotes drifting at different speeds
  const columns = [0, 1, 2].map(c => TESTIMONIALS.filter((_, i) => i % 3 === c))

  return (
    <section aria-labelledby='community-heading' className='landing-section overflow-hidden'>
      <div className='landing-container'>
        <SectionHeading
          id='community-heading'
          eyebrow='Community'
          title={
            <>
              Built with, and for, <span className='gradient-text'>gamers.</span>
            </>
          }
          sub='A free, community-backed project - shaped by the people who use it every day.'
        />

        <FadeIn className='mt-14 grid grid-cols-2 lg:grid-cols-4 rounded-3xl border border-white/8 overflow-hidden'>
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`p-6 sm:p-8 text-center bg-white/[0.02] ${i % 2 ? 'border-l border-white/8' : ''} ${
                i > 1 ? 'border-t lg:border-t-0 border-white/8' : ''
              } ${i === 2 ? 'lg:border-l' : ''}`}
            >
              <div className='text-3xl sm:text-5xl font-semibold tracking-[-0.04em] text-text-primary'>
                {s.value}
              </div>
              <div className='mt-2 text-xs sm:text-sm text-text-muted'>{s.label}</div>
            </div>
          ))}
        </FadeIn>

        <FadeIn className={`quote-wall mt-6 ${paused ? 'quote-wall--paused' : ''}`}>
          {columns.map((col, c) => (
            <div
              key={col[0].username}
              className={`quote-wall__col ${c === 1 ? 'hidden md:block' : ''} ${c === 2 ? 'hidden lg:block' : ''}`}
              style={{ '--dur': `${48 + c * 10}s` } as React.CSSProperties}
            >
              {/* duplicated so the loop is seamless; the copy is hidden from assistive tech */}
              {(['original', 'loop-copy'] as const).map(copy => (
                <div
                  key={copy}
                  className='quote-wall__track'
                  aria-hidden={copy === 'loop-copy' || undefined}
                >
                  {col.map(t => (
                    <figure key={`${copy}-${t.username}`} className='quote'>
                      <FaQuoteLeft className='w-4 h-4 text-white/15' aria-hidden='true' />
                      <blockquote className='mt-3 text-[15px] text-text-primary/90 leading-relaxed'>
                        {t.content}
                      </blockquote>
                      <figcaption className='mt-4 flex items-center gap-2.5 text-sm'>
                        <span className='quote__avatar' aria-hidden='true'>
                          {t.username
                            .replace(/[^A-Za-z0-9]/g, '')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <span className='text-text-primary font-medium'>{t.username}</span>
                        <span className='text-text-muted'>· {t.platform}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </FadeIn>
        <div className='mt-4 flex justify-end'>
          <button type='button' onClick={() => setPaused(p => !p)} className='quote-wall__pause'>
            {paused ? <FaPlay aria-hidden='true' /> : <FaPause aria-hidden='true' />}
            {paused ? 'Resume testimonials' : 'Pause testimonials'}
          </button>
        </div>
      </div>
    </section>
  )
}
