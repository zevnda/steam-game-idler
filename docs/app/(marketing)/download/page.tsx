import FooterSection from '@/app/(marketing)/(home)/_components/FooterSection'
import NavBar from '@/app/(marketing)/(home)/_components/NavBar'
import StoreLoader from '@/app/(marketing)/(home)/_components/StoreLoader'
import DownloadHero from '@/app/(marketing)/download/_components/DownloadHero'
import PreviousVersionsSection from '@/app/(marketing)/download/_components/PreviousVersionsSection'

export const metadata = {
  title: 'Download Steam Game Idler for Windows & Linux',
  description:
    'Download Steam Game Idler for free on Windows or Linux. Get the latest version with automatic updates, or grab a portable .zip of a previous release.',
  keywords: [
    'Steam Game Idler download',
    'download Steam Game Idler',
    'Steam Game Idler for Windows',
    'Steam Game Idler for Linux',
    'Steam Game Idler installer',
    'Steam Game Idler portable',
    'Steam Game Idler previous versions',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/download',
    siteName: 'Steam Game Idler',
    title: 'Download Steam Game Idler for Windows & Linux',
    description:
      'Download Steam Game Idler for free on Windows or Linux. Get the latest version with automatic updates, or grab a portable .zip of a previous release.',
    images: 'https://steamgameidler.com/og-image.png',
    type: 'website',
  },
  twitter: {
    title: 'Download Steam Game Idler for Windows & Linux',
    description:
      'Download Steam Game Idler for free on Windows or Linux. Get the latest version with automatic updates, or grab a portable .zip of a previous release.',
    image: 'https://steamgameidler.com/og-image.png',
  },
  alternates: {
    canonical: '/download',
  },
}

export default function DownloadPage() {
  return (
    <div className='min-h-screen bg-background'>
      <NavBar />
      <DownloadHero />
      <div className='section-divider' />
      <PreviousVersionsSection />
      <div className='section-divider' />
      <FooterSection />
      <StoreLoader />
    </div>
  )
}
