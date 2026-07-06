'use client'

import { useState } from 'react'
import { FaBook, FaDiscord, FaGithub, FaStar } from 'react-icons/fa6'
import Link from 'next/link'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'
import { formatCount } from '@/app/lib/format'
import { useGlobalStore } from '@/app/lib/globalStore'

function RainbowBadge({
  children,
  href,
  target,
}: {
  children: React.ReactNode
  href?: string
  target?: string
}) {
  const [hovered, setHovered] = useState(false)

  const inner = (
    <div
      className='relative inline-flex overflow-hidden rounded-full cursor-pointer'
      style={{ padding: '1px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Single rotating full rainbow — one animation, no drift */}
      <div
        className='absolute inset-0 rounded-full'
        style={{
          background: `conic-gradient(
            from var(--angle),
            hsl(0,36%,50%),
            hsl(50,36%,50%),
            hsl(100,36%,50%),
            hsl(160,36%,50%),
            hsl(210,36%,50%),
            hsl(265,36%,50%),
            hsl(315,36%,50%),
            hsl(360,36%,50%)
          )`,
          animation: 'rainbow-border 4s linear infinite',
        }}
      />
      {/* Inner black mask — fades on hover to reveal the rainbow as a low-opacity fill */}
      <div
        className='absolute rounded-full'
        style={{
          inset: '1px',
          background: hovered ? 'rgba(0,0,0,0.80)' : '#000000',
          transition: 'background 300ms ease',
        }}
      />
      {/* Content */}
      <div className='relative z-10 flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-text-muted'>
        {children}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link prefetch={false} href={href} target={target}>
        {inner}
      </Link>
    )
  }
  return inner
}

export default function HeroSection() {
  const { latestVersion, repoStars, totalDownloads, totalGames } = useGlobalStore(state => state)

  return (
    <section className='min-h-screen flex items-center relative overflow-hidden'>
      {/* God rays — 3 thick shafts from an off-screen upper-right source */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: `conic-gradient(
            from 160deg at 108% -25%,
            transparent 0deg,
            rgba(255,255,255,0.02) 4deg,
            rgba(255,255,255,0.09) 10deg,
            rgba(255,255,255,0.11) 16deg,
            rgba(255,255,255,0.09) 22deg,
            rgba(255,255,255,0.02) 28deg,
            transparent 33deg,
            transparent 45deg,
            rgba(255,255,255,0.01) 48deg,
            rgba(255,255,255,0.05) 52deg,
            rgba(255,255,255,0.07) 55deg,
            rgba(255,255,255,0.05) 58deg,
            rgba(255,255,255,0.01) 62deg,
            transparent 66deg,
            transparent 74deg,
            rgba(255,255,255,0.01) 77deg,
            rgba(255,255,255,0.07) 82deg,
            rgba(255,255,255,0.09) 86deg,
            rgba(255,255,255,0.07) 90deg,
            rgba(255,255,255,0.01) 94deg,
            transparent 98deg,
            transparent 360deg
          )`,
          maskImage:
            'linear-gradient(to bottom left, black 0%, rgba(0,0,0,0.55) 38%, transparent 72%)',
          WebkitMaskImage:
            'linear-gradient(to bottom left, black 0%, rgba(0,0,0,0.55) 38%, transparent 72%)',
        }}
      />

      {/* App screenshot — right half, desktop only */}
      <div
        className='absolute top-0 right-0 bottom-0 hidden lg:flex items-center'
        style={{ width: '55%', pointerEvents: 'none' }}
      >
        <div
          className='w-full py-16 pr-6'
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 16%, black 88%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 16%, black 88%, transparent 100%)',
          }}
        >
          <div className='mockup-float' style={{ willChange: 'transform' }}>
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src='https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev/example.webp'
                alt='Steam Game Idler application dashboard'
                width={1600}
                height={860}
                className='w-full h-auto block'
                loading='eager'
              />
            </div>

            {/* Reflection */}
            <div
              className='blur-sm'
              style={{
                height: '80px',
                overflow: 'hidden',
                opacity: 0.2,
                maskImage: 'linear-gradient(to bottom, black, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
                marginTop: '1px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src='https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev/example.webp'
                alt=''
                aria-hidden='true'
                style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleY(-1)' }}
                loading='eager'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content — left half */}
      <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
        <div className='min-h-screen py-16 sm:py-20 md:py-24 flex items-center'>
          <div className='w-full lg:max-w-[50%] space-y-7 text-center lg:text-left'>
            {/* Rainbow badges */}
            <div className='flex flex-wrap gap-2 justify-center lg:justify-start'>
              <RainbowBadge
                href={`https://github.com/zevnda/steam-game-idler/releases/${latestVersion}`}
                target='_blank'
              >
                <span className='w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse' />v
                {latestVersion} Available
              </RainbowBadge>
              <RainbowBadge
                href='https://github.com/zevnda/steam-game-idler/stargazers'
                target='_blank'
              >
                <FaStar className='w-3 h-3' />
                {repoStars !== null ? repoStars.toLocaleString() : '…'} Stars
              </RainbowBadge>
            </div>

            {/* Heading */}
            <div>
              <h1 className='text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tight'>
                <span className='text-text-primary'>STEAM</span>{' '}
                <span className='block gradient-text'>GAME IDLER</span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className='text-lg text-text-muted max-w-lg leading-relaxed mx-auto lg:mx-0'>
              Automate your Steam library. Farm trading cards, manage achievements, and boost
              playtime — all from a single free desktop app. Trusted by over 100,000 Steam users as
              a modern alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.
            </p>

            {/* Buttons */}
            <div className='flex flex-wrap gap-3 justify-center lg:justify-start'>
              <DownloadButton />
              <Link prefetch={false} href='/docs' className='btn-ghost px-6 py-3'>
                <FaBook className='w-4 h-4' />
                Documentation
              </Link>
              <Link
                prefetch={false}
                href='https://github.com/zevnda/steam-game-idler'
                target='_blank'
                className='btn-ghost px-4 py-3'
                aria-label='View on GitHub'
              >
                <FaGithub className='w-4 h-4' />
              </Link>
              <Link
                prefetch={false}
                href='https://discord.com/invite/5kY2ZbVnZ8'
                target='_blank'
                className='btn-ghost px-4 py-3'
                aria-label='Join our Discord'
              >
                <FaDiscord className='w-4 h-4' />
              </Link>
            </div>

            {/* Stats */}
            <div className='flex items-center justify-center lg:justify-start gap-6 sm:gap-8 pt-2'>
              <div className='text-center'>
                <div className='text-xl sm:text-2xl font-bold text-text-primary'>
                  {totalDownloads ? `${totalDownloads}` : '100K+'}
                </div>
                <div className='text-xs text-text-muted uppercase tracking-wider mt-1'>
                  Downloads
                </div>
              </div>
              <div
                className='w-px h-8'
                style={{ background: 'var(--color-border)' }}
                aria-hidden='true'
              />
              <div className='text-center'>
                <div className='text-xl sm:text-2xl font-bold text-text-primary'>
                  {formatCount(totalGames)}
                </div>
                <div className='text-xs text-text-muted uppercase tracking-wider mt-1'>Games</div>
              </div>
              <div
                className='w-px h-8'
                style={{ background: 'var(--color-border)' }}
                aria-hidden='true'
              />
              <div className='text-center'>
                <div className='text-xl sm:text-2xl font-bold text-text-primary'>100%</div>
                <div className='text-xs text-text-muted uppercase tracking-wider mt-1'>
                  Public Source Code
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
