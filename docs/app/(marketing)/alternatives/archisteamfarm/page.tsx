import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import AlternativeDetail from '@/app/(marketing)/alternatives/_components/AlternativeDetail'
import { COMPETITORS } from '@/app/(marketing)/alternatives/_data/competitors'
import JsonLd from '@/app/lib/JsonLd'

const competitor = COMPETITORS.archisteamfarm

export const metadata = {
  title: { absolute: 'ArchiSteamFarm Alternative - ASF vs Steam Game Idler' },
  description:
    'A free ArchiSteamFarm alternative with a desktop app instead of config files and a command line. Compare ASF and Steam Game Idler feature by feature.',
  keywords: [
    'ArchiSteamFarm alternative',
    'ArchiSteamFarm comparison',
    'ArchiSteamFarm features',
    'ASF alternative',
    'Steam automation comparison',
    'Steam card farming comparison',
    'Steam Game Idler features',
    'Steam Game Idler',
    'Steam Idler',
    'Steam Card Idler',
    'Steam Automation',
    'Steam Trading Cards',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/alternatives/archisteamfarm',
    siteName: 'Steam Game Idler',
    title: 'ArchiSteamFarm Alternative - ASF vs Steam Game Idler',
    description:
      'A free ArchiSteamFarm alternative with a desktop app instead of config files and a command line. Compare ASF and Steam Game Idler feature by feature.',
    images: 'https://steamgameidler.com/asf-og-image.png',
    type: 'article',
  },
  twitter: {
    title: 'ArchiSteamFarm Alternative - ASF vs Steam Game Idler',
    description:
      'A free ArchiSteamFarm alternative with a desktop app instead of config files and a command line. Compare ASF and Steam Game Idler feature by feature.',
    image: 'https://steamgameidler.com/asf-og-image.png',
  },
  alternates: {
    canonical: '/alternatives/archisteamfarm',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'ArchiSteamFarm Alternative - ASF vs Steam Game Idler',
  'description':
    'A free ArchiSteamFarm alternative with a desktop app instead of config files and a command line. Compare ASF and Steam Game Idler feature by feature.',
  'url': 'https://steamgameidler.com/alternatives/archisteamfarm',
  'image': 'https://steamgameidler.com/asf-og-image.png',
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
