import { FaArrowRight } from 'react-icons/fa'
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
    summary:
      'Steam Game Idler is the go-to ArchiSteamFarm alternative for users who want a visual desktop app instead of a CLI. Get card farming, achievement management, inventory selling, and playtime boosting — no config files, no command line.',
  },
  {
    slug: 'steam-achievement-manager',
    name: 'Steam Achievement Manager',
    abbr: 'SAM',
    summary:
      'Steam Game Idler is a full Steam Achievement Manager alternative that goes beyond achievements. Manage, unlock, and lock achievements — plus card farming, inventory selling, and playtime boosting — all in one actively maintained app.',
  },
  {
    slug: 'idle-master',
    name: 'Idle Master',
    abbr: 'IM',
    summary:
      'Steam Game Idler is the modern Idle Master replacement. Idle Master is abandoned and no longer maintained — Steam Game Idler picks up where it left off with active development, achievement management, and a clean interface.',
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
            The better alternative to <span className='gradient-text'>popular Steam tools</span>
          </h1>
          <p className='text-lg text-text-muted max-w-2xl mx-auto leading-relaxed'>
            Looking for an alternative to ArchiSteamFarm, Idle Master, or Steam Achievement Manager?
            Steam Game Idler replaces all three — with a modern interface, active development, and
            no configuration required.
          </p>
        </div>

        {/* Comparison cards */}
        <div className='flex flex-col gap-6'>
          {comparisons.map(alt => (
            <Link
              key={alt.slug}
              prefetch={false}
              href={`/alternatives/${alt.slug}`}
              className='card p-8 group block'
            >
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                <div>
                  <span className='text-xs font-semibold text-text-muted uppercase tracking-wider'>
                    {alt.abbr}
                  </span>
                  <h2 className='text-xl font-bold text-text-primary mt-1'>{alt.name}</h2>
                </div>
                <div className='flex items-center gap-2 text-accent text-sm font-medium shrink-0'>
                  View comparison
                  <FaArrowRight className='w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-150' />
                </div>
              </div>
              <p className='text-text-muted leading-relaxed'>{alt.summary}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className='section-divider' />
      <FooterSection />
    </div>
  )
}
