import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import AlternativeDetail from '@/app/(marketing)/alternatives/_components/AlternativeDetail'
import { COMPETITORS } from '@/app/(marketing)/alternatives/_data/competitors'
import JsonLd from '@/app/lib/JsonLd'

const competitor = COMPETITORS['steam-achievement-manager']

export const metadata = {
  title: { absolute: 'Steam Achievement Manager Alternative - SAM vs SGI' },
  description:
    'A free Steam Achievement Manager alternative that also unlocks achievements automatically, farms cards and boosts playtime. Compare SAM and Steam Game Idler.',
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
    title: 'Steam Achievement Manager Alternative - SAM vs SGI',
    description:
      'A free Steam Achievement Manager alternative that also unlocks achievements automatically, farms cards and boosts playtime. Compare SAM and Steam Game Idler.',
    images: 'https://steamgameidler.com/sam-og-image.png',
    type: 'article',
  },
  twitter: {
    title: 'Steam Achievement Manager Alternative - SAM vs SGI',
    description:
      'A free Steam Achievement Manager alternative that also unlocks achievements automatically, farms cards and boosts playtime. Compare SAM and Steam Game Idler.',
    image: 'https://steamgameidler.com/sam-og-image.png',
  },
  alternates: {
    canonical: '/alternatives/steam-achievement-manager',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'Steam Achievement Manager Alternative - SAM vs SGI',
  'description':
    'A free Steam Achievement Manager alternative that also unlocks achievements automatically, farms cards and boosts playtime. Compare SAM and Steam Game Idler.',
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
    <div className='landing min-h-screen bg-background'>
      <JsonLd data={articleSchema} />
      <LandingNav />
      <AlternativeDetail competitor={competitor} />
      <LandingFooter />
    </div>
  )
}
