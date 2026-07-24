import { FiBook } from 'react-icons/fi'
import Link from 'next/link'
import AdScripts from '@/app/(marketing)/(home)/_components/AdScripts'
import AdSlot from '@/app/(marketing)/(home)/_components/AdSlot'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'
import FooterSection from '@/app/(marketing)/(home)/_components/FooterSection'
import NavBar from '@/app/(marketing)/(home)/_components/NavBar'
import AlternativeComparisonTable from '@/app/(marketing)/alternatives/_components/AlternativeComparisonTable'
import AlternativeHero from '@/app/(marketing)/alternatives/_components/AlternativeHero'
import NarrativeSection from '@/app/(marketing)/alternatives/_components/NarrativeSection'
import WhyChooseSection from '@/app/(marketing)/alternatives/_components/WhyChooseSection'
import { COMPETITORS } from '@/app/(marketing)/alternatives/_data/competitors'
import SectionHeading from '@/app/(marketing)/pro/_components/SectionHeading'
import { FadeIn } from '@/app/lib/animations'

const competitor = COMPETITORS['steam-achievement-manager']

export const metadata = {
  title: 'Steam Achievement Manager Feature Comparison',
  description:
    'See why Steam Game Idler is the best alternative to Steam Achievement Manager for Steam automation. Compare features like card farming, achievement management, and user experience',
  keywords: [
    'Steam Achievement Manager alternative',
    'Steam Achievement Manager comparison',
    'Steam Achievement Manager features',
    'Steam Game Idler features',
    'Steam Game Idler',
    'Steam Idler',
    'Steam Card Idler',
    'Steam Automation',
    'Steam Trading Cards',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/alternatives/steam-achievement-manager',
    siteName: 'Steam Game Idler',
    title: 'Steam Achievement Manager Feature Comparison | Steam Game Idler',
    description:
      'See why Steam Game Idler is the best alternative to Steam Achievement Manager for Steam automation. Compare features like card farming, achievement management, and user experience',
    images: 'https://steamgameidler.com/sam-og-image.png',
    type: 'article',
  },
  twitter: {
    title: 'Steam Achievement Manager Feature Comparison | Steam Game Idler',
    description:
      'See why Steam Game Idler is the best alternative to Steam Achievement Manager for Steam automation. Compare features like card farming, achievement management, and user experience',
    image: 'https://steamgameidler.com/sam-og-image.png',
  },
  alternates: {
    canonical: '/alternatives/steam-achievement-manager',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'Steam Achievement Manager Feature Comparison | Steam Game Idler',
  'description':
    'See why Steam Game Idler is the best alternative to Steam Achievement Manager for Steam automation. Compare features like card farming, achievement management, and user experience',
  'url': 'https://steamgameidler.com/alternatives/steam-achievement-manager',
  'image': 'https://steamgameidler.com/sam-og-image.png',
  'author': { '@type': 'Person', 'name': 'zevnda', 'url': 'https://github.com/zevnda' },
  'publisher': {
    '@type': 'Organization',
    'name': 'Steam Game Idler',
    'url': 'https://steamgameidler.com',
  },
}

export default function page() {
  return (
    <div className='min-h-screen bg-background'>
      <AdScripts />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <NavBar />
      <div className='relative'>
        <AlternativeHero competitor={competitor} />

        <div className='section-divider' />

        <AdSlot slot='1265004536' />

        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <div className='max-w-5xl mx-auto'>
              <FadeIn>
                <SectionHeading label='Detailed Feature Comparison' />
              </FadeIn>
              <AlternativeComparisonTable competitor={competitor} />
            </div>
          </div>
        </section>

        <div className='section-divider' />

        <AdSlot slot='3005445709' />

        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <NarrativeSection competitor={competitor} />
          </div>
        </section>

        <div className='section-divider' />

        <AdSlot slot='1265004536' />

        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <WhyChooseSection competitor={competitor} />
          </div>
        </section>

        <div className='section-divider' />

        <AdSlot slot='3005445709' />

        <section className='py-24 sm:py-32 relative'>
          <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
            <FadeIn className='text-center max-w-2xl mx-auto'>
              <h2 className='text-4xl sm:text-5xl md:text-6xl text-text-primary mb-6 leading-tight tracking-tight'>
                Ready to upgrade from{' '}
                <span className='gradient-text'>Steam Achievement Manager?</span>
              </h2>
              <p className='text-text-muted text-lg mb-10'>{competitor.ctaDescription}</p>

              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <DownloadButton />
                <Link prefetch={false} href='/docs' className='btn-ghost px-8 py-3.5'>
                  <FiBook className='w-4 h-4' />
                  Documentation
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        <div className='section-divider' />

        <FooterSection />
      </div>
    </div>
  )
}
