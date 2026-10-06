'use client'

import type { Ref } from 'react'
import { FaGithub, FaStar } from 'react-icons/fa6'
import { TbArrowDown } from 'react-icons/tb'
import { scrollToPlayground } from '../demoStore'
import Link from 'next/link'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'
import { useGlobalStore } from '@/app/lib/globalStore'

/**
 * The hero's copy, centred above the 3D window. It fades and lifts away (driven by the showcase's
 * `--t` scroll variable in CSS) as the window rises into the playground.
 */
interface ShowcaseHeroProps {
  ref?: Ref<HTMLDivElement>
  /** the copy block only - its bottom edge is where the window frame starts */
  textRef?: Ref<HTMLDivElement>
  placeholderRef?: Ref<HTMLDivElement>
  /** the live 3D stage is up - the placeholder fades out under it */
  live: boolean
}

export default function ShowcaseHero({ ref, textRef, placeholderRef, live }: ShowcaseHeroProps) {
  const { latestVersion, repoStars, totalDownloads } = useGlobalStore(state => state)

  return (
    <div ref={ref} className='showcase__hero'>
      <div ref={textRef}>
        <Link
          prefetch={false}
          href={`https://github.com/zevnda/steam-game-idler/releases/${latestVersion}`}
          target='_blank'
          className='rainbow-chip'
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
          <span className='block font-mono text-xs sm:text-sm uppercase tracking-[0.3em] text-text-muted mb-5'>
            Steam Game Idler
          </span>
          <span className='block text-[clamp(2.6rem,6.4vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-text-primary'>
            Your Steam library,
            <br />
            <span className='gradient-text'>on autopilot.</span>
          </span>
        </h1>

        <p className='mt-6 max-w-xl mx-auto text-base sm:text-lg text-text-muted leading-relaxed'>
          Farm trading cards, unlock achievements, boost playtime and sell your inventory - all from
          one free desktop app.
        </p>

        <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
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

        <div className='mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-text-muted'>
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
            alt=''
            fetchPriority='high'
            decoding='async'
            className='hero-ph__img'
          />
        </picture>
      </div>
    </div>
  )
}
