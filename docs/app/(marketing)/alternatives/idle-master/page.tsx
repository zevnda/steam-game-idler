import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import AlternativeDetail from '@/app/(marketing)/alternatives/_components/AlternativeDetail'
import { COMPETITORS } from '@/app/(marketing)/alternatives/_data/competitors'
import JsonLd from '@/app/lib/JsonLd'

const competitor = COMPETITORS['idle-master']

export const metadata = {
  title: { absolute: 'Idle Master Alternative - Idle Master vs Steam Game Idler' },
  description:
    'Idle Master is abandoned. Steam Game Idler is a free, actively developed Idle Master alternative for card farming, achievements and more. Compare both.',
  keywords: [
    'Idle Master alternative',
    'Idle Master comparison',
    'Idle Master features',
    'Steam Game Idler features',
    'Steam Game Idler',
    'Steam Idler',
    'Steam Card Idler',
    'Steam Automation',
    'Steam Trading Cards',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/alternatives/idle-master',
    siteName: 'Steam Game Idler',
    title: 'Idle Master Alternative - Idle Master vs Steam Game Idler',
    description:
      'Idle Master is abandoned. Steam Game Idler is a free, actively developed Idle Master alternative for card farming, achievements and more. Compare both.',
    images: 'https://steamgameidler.com/im-og-image.png',
    type: 'article',
  },
  twitter: {
    title: 'Idle Master Alternative - Idle Master vs Steam Game Idler',
    description:
      'Idle Master is abandoned. Steam Game Idler is a free, actively developed Idle Master alternative for card farming, achievements and more. Compare both.',
    image: 'https://steamgameidler.com/im-og-image.png',
  },
  alternates: {
    canonical: '/alternatives/idle-master',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'Idle Master Alternative - Idle Master vs Steam Game Idler',
  'description':
    'Idle Master is abandoned. Steam Game Idler is a free, actively developed Idle Master alternative for card farming, achievements and more. Compare both.',
  'url': 'https://steamgameidler.com/alternatives/idle-master',
  'image': 'https://steamgameidler.com/im-og-image.png',
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
