import { FaArrowRight } from 'react-icons/fa'
import { FiAward, FiCheck, FiClock, FiTerminal } from 'react-icons/fi'
import FooterSection from '@docs/components/home/FooterSection'
import NavBar from '@docs/components/home/NavBar'
import Link from 'next/link'

export const metadata = {
  title: 'The Best Alternative to ArchiSteamFarm, Idle Master & Steam Achievement Manager',
  description:
    'Looking for an alternative to ArchiSteamFarm, Idle Master, or Steam Achievement Manager? Steam Game Idler replaces all three with a free, modern desktop app.',
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
    title: 'The Best Alternative to ArchiSteamFarm, Idle Master & Steam Achievement Manager',
    description:
      'Looking for an alternative to ArchiSteamFarm, Idle Master, or Steam Achievement Manager? Steam Game Idler replaces all three with a free, modern desktop app.',
    images: 'https://steamgameidler.com/og-image.png',
    type: 'website',
  },
  twitter: {
    title: 'Steam Automation Tool Alternatives | Steam Game Idler',
    description:
      'Compare Steam Game Idler against ArchiSteamFarm, Idle Master, and Steam Achievement Manager.',
    image: 'https://steamgameidler.com/og-image.png',
  },
  alternates: {
    canonical: '/alternatives',
  },
}

const comparisons = [
  {
    slug: 'archisteamfarm',
    name: 'ArchiSteamFarm',
    abbr: 'ASF',
    Icon: FiTerminal,
    summary:
      'Steam Game Idler is the go-to ArchiSteamFarm alternative for users who want a visual desktop app instead of a CLI. Get card farming, achievement management, inventory selling, and playtime boosting — no config files, no command line.',
    highlights: [
      'No CLI, config files, or command line',
      'No Java or Docker required',
      'Achievements & inventory selling built in',
    ],
  },
  {
    slug: 'steam-achievement-manager',
    name: 'Steam Achievement Manager',
    abbr: 'SAM',
    Icon: FiAward,
    summary:
      'Steam Game Idler is a full Steam Achievement Manager alternative that goes beyond achievements. Manage, unlock, and lock achievements — plus card farming, inventory selling, and playtime boosting — all in one actively maintained app.',
    highlights: [
      'Actively maintained with regular updates',
      'Card farming & inventory selling included',
      'Works on modern Windows out of the box',
    ],
  },
  {
    slug: 'idle-master',
    name: 'Idle Master',
    abbr: 'IM',
    Icon: FiClock,
    summary:
      'Steam Game Idler is the modern Idle Master replacement. Idle Master is abandoned and no longer maintained — Steam Game Idler picks up where it left off with active development, achievement management, and a clean interface.',
    highlights: [
      'Actively developed — Idle Master is abandoned',
      'Achievement management on top of card farming',
      'Modern interface with more features',
    ],
  },
]

export default function AlternativesPage() {
  return (
    <div className='min-h-screen bg-background'>
      <NavBar />

      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-4xl pt-36 pb-24 sm:pt-44 sm:pb-32'>
        {/* Header */}
        <div className='mb-16 text-center'>
          <h1 className='text-4xl sm:text-5xl font-bold text-text-primary mb-6 leading-tight tracking-tight'>
            The better alternative to popular <span className='gradient-text'>Steam tools</span>
          </h1>
          <p className='text-lg text-text-muted max-w-2xl mx-auto leading-relaxed'>
            Looking for an alternative to ArchiSteamFarm, Steam Achievement Manager, or Idle Master?
            Steam Game Idler replaces all three — with a modern interface, active development, and
            no complex configuration required.
          </p>
        </div>

        {/* Comparison cards */}
        <div className='flex flex-col gap-5'>
          {comparisons.map(alt => (
            <Link
              key={alt.slug}
              prefetch={false}
              href={`/alternatives/${alt.slug}`}
              className='card group block'
            >
              <div className='p-6 sm:p-8'>
                {/* Card header */}
                <div className='flex items-start justify-between gap-4 mb-5'>
                  <div className='flex items-center gap-4'>
                    <div
                      className='w-10 h-10 rounded-lg flex items-center justify-center shrink-0'
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <alt.Icon className='w-5 h-5 text-text-muted' />
                    </div>
                    <div>
                      <span className='text-xs font-mono font-semibold text-text-muted uppercase tracking-widest'>
                        {alt.abbr}
                      </span>
                      <h2 className='text-lg font-bold text-text-primary leading-snug'>
                        {alt.name}
                      </h2>
                    </div>
                  </div>
                  <div className='flex items-center gap-1.5 text-accent text-sm font-medium shrink-0 pt-1'>
                    <span className='hidden sm:inline'>View comparison</span>
                    <FaArrowRight className='w-3 h-3 group-hover:translate-x-1 transition-transform duration-150' />
                  </div>
                </div>

                {/* Divider */}
                <div
                  className='mb-5'
                  style={{ height: '1px', background: 'var(--color-border)' }}
                />

                {/* Highlights */}
                <div className='flex flex-wrap gap-2 mb-5'>
                  {alt.highlights.map(h => (
                    <span
                      key={h}
                      className='inline-flex items-center gap-1.5 text-xs text-text-muted rounded-full px-3 py-1'
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <FiCheck className='w-3 h-3 text-accent shrink-0' />
                      {h}
                    </span>
                  ))}
                </div>

                {/* Summary */}
                <p className='text-sm text-text-muted leading-relaxed'>{alt.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className='section-divider' />
      <FooterSection />
    </div>
  )
}
