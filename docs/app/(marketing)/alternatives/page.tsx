import { FiArrowRight } from 'react-icons/fi'
import Link from 'next/link'
import Compare from '@/app/(marketing)/(home)/_components/landing/Compare'
import FinalCta from '@/app/(marketing)/(home)/_components/landing/FinalCta'
import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import { StaggerGroup, StaggerItem } from '@/app/lib/animations'

export const metadata = {
  title: { absolute: 'Steam Idler Alternatives - ASF, Idle Master & SAM Compared' },
  description:
    'Compare Steam Game Idler with ArchiSteamFarm, Idle Master and Steam Achievement Manager: one free desktop app for cards, achievements and playtime.',
  keywords: [
    'Steam automation alternatives',
    'best Steam card farming tool',
    'ArchiSteamFarm alternative',
    'Idle Master alternative',
    'Steam Achievement Manager alternative',
    'Steam Game Idler comparison',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/alternatives',
    siteName: 'Steam Game Idler',
    title: 'Steam Idler Alternatives - ASF, Idle Master & SAM Compared',
    description:
      'Compare Steam Game Idler with ArchiSteamFarm, Idle Master and Steam Achievement Manager: one free desktop app for cards, achievements and playtime.',
    images: 'https://steamgameidler.com/og-image.png',
    type: 'website',
  },
  twitter: {
    title: 'Steam Idler Alternatives - ASF, Idle Master & SAM Compared',
    description:
      'Compare Steam Game Idler with ArchiSteamFarm, Idle Master and Steam Achievement Manager: one free desktop app for cards, achievements and playtime.',
    image: 'https://steamgameidler.com/og-image.png',
  },
  alternates: {
    canonical: '/alternatives',
  },
}

const comparisons = [
  {
    slug: 'archisteamfarm',
    accent: '#60a5fa',
    name: 'ArchiSteamFarm',
    summary:
      'Steam Game Idler is the go-to ArchiSteamFarm alternative for users who want a visual desktop app instead of a CLI. Get card farming, achievement management, inventory selling, and playtime boosting — no config files, no command line.',
  },
  {
    slug: 'steam-achievement-manager',
    accent: '#c084fc',
    name: 'Steam Achievement Manager',
    summary:
      'Steam Game Idler is a full Steam Achievement Manager alternative that goes beyond achievements. Manage, unlock, and lock achievements — plus card farming, inventory selling, and playtime boosting — all in one actively maintained app.',
  },
  {
    slug: 'idle-master',
    accent: '#fb923c',
    name: 'Idle Master',
    summary:
      'Steam Game Idler is the modern Idle Master replacement. Idle Master is abandoned and no longer maintained — Steam Game Idler picks up where it left off with active development, achievement management, and a clean interface.',
  },
]

export default function AlternativesPage() {
  return (
    <div className='landing min-h-screen bg-background'>
      <LandingNav />

      <main>
        {/* A secondary-page header (same shape as /blog and /changelog), not a home-style hero:
            left-aligned, a size down, no hero buttons - the tool cards right under it are the
            page's actions. */}
        <section className='landing-container pt-36 pb-24 sm:pt-44 sm:pb-32'>
          <header className='page-enter max-w-2xl mx-auto text-center lg:mx-0 lg:text-left'>
            <h1 className='gradient-text w-fit mx-auto lg:mx-0 text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance'>
              The better Steam tool alternative
            </h1>
            <p className='mt-6 text-lg leading-relaxed text-text-muted'>
              Looking for an alternative to ArchiSteamFarm, Steam Achievement Manager or Idle
              Master? Steam Game Idler replaces all three, with a modern interface, active
              development and no configuration files. Pick the tool you use today for a full
              comparison.
            </p>
          </header>

          <StaggerGroup className='mt-12 sm:mt-16 grid gap-4 lg:grid-cols-3'>
            {comparisons.map(alt => (
              <StaggerItem key={alt.slug} className='h-full'>
                {/* --accent tints the tile's top glow, one hue per tool from the home bento's palette */}
                <Link
                  prefetch={false}
                  href={`/alternatives/${alt.slug}`}
                  className='bento-tile group focus-visible:outline-2 focus-visible:outline-white/60'
                  style={{ '--accent': alt.accent } as React.CSSProperties}
                >
                  <div className='relative flex flex-1 flex-col p-7 sm:p-8'>
                    <h2 className='text-2xl font-semibold tracking-[-0.03em] text-text-primary'>
                      {alt.name}
                    </h2>
                    <p className='mt-3 flex-1 text-base text-text-muted leading-relaxed'>
                      {alt.summary}
                    </p>
                    <span className='bento-try mt-7 self-start'>
                      See the comparison
                      <FiArrowRight className='w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* the home page's four-tool table: every competitor on one screen */}
        <Compare />

        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  )
}
