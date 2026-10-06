'use client'

import type { Ref } from 'react'
import { FaGithub, FaStar } from 'react-icons/fa6'
import { TbArrowDown } from 'react-icons/tb'
import { scrollToPlayground } from '../demoStore'
import Link from 'next/link'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'
import { useGlobalStore } from '@/app/lib/globalStore'

/**
 * The hero's copy, centred above the 3D window. As the window rises into the playground the copy
 * hands over to it rather than just fading (all driven by the showcase's `--t` scroll variable):
 * the supporting lines (`.hero-recede`, in `--i` order) step back first, while the headline itself
 * travels into the playground's heading slot and stays there as the playground's heading - see
 * `drawOverlay` in Showcase.tsx.
 */
interface ShowcaseHeroProps {
  ref?: Ref<HTMLDivElement>
  /** the copy block only - its bottom edge is where the window frame starts */
  textRef?: Ref<HTMLDivElement>
  /** the headline's text (not the eyebrow above it) - the part that travels */
  headlineRef?: Ref<HTMLSpanElement>
  placeholderRef?: Ref<HTMLDivElement>
  /** the live 3D stage is up - the placeholder fades out under it */
  live: boolean
}

export default function ShowcaseHero({
  ref,
  textRef,
  headlineRef,
  placeholderRef,
  live,
}: ShowcaseHeroProps) {
  const { latestVersion, repoStars, totalDownloads } = useGlobalStore(state => state)

  return (
    <div ref={ref} className='showcase__hero'>
      <div ref={textRef}>
        <Link
          prefetch={false}
          href={`https://github.com/zevnda/steam-game-idler/releases/${latestVersion}`}
          target='_blank'
          className='rainbow-chip hero-recede'
          style={{ '--i': 0 } as React.CSSProperties}
        >
          <span className='rainbow-chip__inner'>
            {/* static on purpose: the rotating rim already draws the eye - a pulse on top
                of it was a second, competing loop */}
            <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' aria-hidden='true' />v
            {latestVersion} is out
            <span className='text-text-muted'>· Windows & Linux</span>
          </span>
        </Link>

        <h1 className='mt-7'>
          {/* The H1's keyword half: carries the page's primary query ("steam idler"), while the
              display headline below stays short because it travels into the playground heading.
              The brand leads the title tag and the intro paragraph instead - see seo-brief.md. */}
          <span
            className='hero-recede block font-mono text-xs sm:text-sm uppercase tracking-[0.3em] text-text-muted mb-5'
            style={{ '--i': 1 } as React.CSSProperties}
          >
            The free Steam idler
          </span>
          {/* a real space between the two block spans, so the H1's text reads as two phrases
              ("...idler Your Steam library...") rather than one run-on word */}{' '}
          {/* inline-block, so its box is the text itself (widest line) - Showcase measures it to
              plot the headline's path into the playground heading */}
          <span
            ref={headlineRef}
            className='hero-headline inline-block text-[clamp(2.6rem,6.4vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-text-primary'
          >
            {/* each line is its own box: centred here, they slide to left-aligned as the
                headline travels into the (left-aligned) playground heading */}
            <span className='hero-headline__line'>Your Steam library,</span>
            <br />
            <span className='hero-headline__line gradient-text'>on autopilot.</span>
          </span>
        </h1>

        <p
          className='hero-recede mt-6 max-w-xl mx-auto text-base sm:text-lg text-text-muted leading-relaxed'
          style={{ '--i': 2 } as React.CSSProperties}
        >
          Steam Game Idler is a Steam idler for Windows and Linux. It farms trading cards, builds up
          playtime hours and unlocks achievements across your whole library while you do something
          else.
        </p>

        {/* hero-recede--flat: no blur here - a filter would cut the ghost button's
            backdrop-blur off from the window behind it */}
        <div
          className='hero-recede hero-recede--flat mt-8 flex flex-wrap items-center justify-center gap-3'
          style={{ '--i': 3 } as React.CSSProperties}
        >
          <DownloadButton label='Download for free' />
          <button
            type='button'
            onClick={scrollToPlayground}
            className='btn-ghost px-6 py-3 rounded-full bg-black/40 backdrop-blur-sm'
          >
            Try the live demo
            <TbArrowDown className='w-4 h-4' />
          </button>
        </div>

        <div
          className='hero-recede mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-text-muted'
          style={{ '--i': 4 } as React.CSSProperties}
        >
          <span>
            <strong className='text-text-primary font-semibold'>{totalDownloads || '100K+'}</strong>{' '}
            downloads
          </span>
          <span className='w-1 h-1 rounded-full bg-white/25' aria-hidden='true' />
          <Link
            prefetch={false}
            href='https://github.com/zevnda/steam-game-idler'
            target='_blank'
            className='inline-flex items-center gap-1.5 hover:text-text-primary transition-colors'
          >
            <FaGithub className='w-3.5 h-3.5' />
            <FaStar className='w-3 h-3 text-amber-300' />
            <strong className='text-text-primary font-semibold'>
              {repoStars.toLocaleString()}
            </strong>{' '}
            stars
          </Link>
          <span className='w-1 h-1 rounded-full bg-white/25' aria-hidden='true' />
          <span>Free & public source</span>
        </div>
      </div>

      {/*
        A static, pixel-exact snapshot of the 3D window's opening frame (the mock's Games page,
        rendered by the same canvas code), posed with CSS 3D to match the stage camera. It holds
        the hero until three.js has loaded, then fades out under the identical live window. It
        is also the page's LCP image, so it loads eagerly at high priority.
      */}
      {/* the wrapper carries the scroll fade, so it doesn't fight .hero-ph's own load-time
          opacity transition (which would make the scroll fade lag behind the scrollbar) */}
      <div className='hero-ph-fade'>
        <div
          ref={placeholderRef}
          className={`hero-ph ${live ? 'hero-ph--off' : ''}`}
          aria-hidden='true'
        >
          {/* phones/portrait tablets get the compact (portrait) window - same breakpoint as Showcase */}
          <picture>
            <source
              media='(max-width: 1023px), (max-aspect-ratio: 1/1)'
              srcSet='/landing/sgi-mock-hero-compact-560.webp 560w, /landing/sgi-mock-hero-compact.webp 900w'
              sizes='94vw'
            />
            <img
              src='/landing/sgi-mock-hero.webp'
              srcSet='/landing/sgi-mock-hero-960.webp 960w, /landing/sgi-mock-hero.webp 1600w'
              sizes='min(74vw, 1180px)'
              width={1600}
              height={1000}
              // descriptive for image search - the wrapper's aria-hidden still keeps screen readers
              // from hearing it alongside the identical live 3D window
              alt="Steam Game Idler's Games page, showing a Steam library with idle and achievement buttons on every game"
              fetchPriority='high'
              decoding='async'
              className='hero-ph__img'
            />
          </picture>
        </div>
      </div>
    </div>
  )
}
