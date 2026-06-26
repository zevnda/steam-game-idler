import FooterSection from '@/app/(home)/_components/FooterSection'
import NavBar from '@/app/(home)/_components/NavBar'
import ComparisonSection from '@/app/pro/_components/ComparisonSection'
import { fetchProData } from '@/app/pro/_components/data'
import FAQSection from '@/app/pro/_components/FAQSection'
import FeatureDetailsSection from '@/app/pro/_components/FeatureDetailsSection'
import FeaturesSection from '@/app/pro/_components/FeaturesSection'
import HeroSection from '@/app/pro/_components/HeroSection'
import TierCardsSection from '@/app/pro/_components/TierCardsSection'

export const metadata = {
  title: { absolute: 'Steam Game Idler PRO' },
  description:
    'Upgrade to Steam Game Idler PRO. Remove ads, unlock exclusive themes, automate Steam credentials, free game redemption, and more. Starting at $2/month.',
  keywords: [
    'Steam Game Idler PRO',
    'Steam Game Idler subscription',
    'Steam automation PRO',
    'Steam card farming PRO',
    'Steam Game Idler upgrade',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/pro',
    siteName: 'Steam Game Idler',
    title: 'Steam Game Idler PRO',
    description:
      'Upgrade to Steam Game Idler PRO. Remove ads, unlock exclusive themes, automate Steam credentials, free game redemption, and more.',
    images: 'https://steamgameidler.com/og-image.png',
    type: 'website',
  },
  twitter: {
    title: 'Steam Game Idler PRO',
    description:
      'Upgrade to Steam Game Idler PRO. Remove ads, unlock exclusive themes, automate Steam credentials, free game redemption, and more.',
    image: 'https://steamgameidler.com/og-image.png',
  },
  alternates: {
    canonical: '/pro',
  },
}

export default async function ProPage() {
  const priceData = await fetchProData()

  return (
    <div className='min-h-screen bg-background'>
      <NavBar />
      <div className='relative'>
        <HeroSection priceData={priceData} />
        <FeaturesSection />
        <TierCardsSection priceData={priceData} />
        <ComparisonSection priceData={priceData} />
        <FeatureDetailsSection />
        <FAQSection />
        <div className='section-divider' />
        <FooterSection />
      </div>
    </div>
  )
}
