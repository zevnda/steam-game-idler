import FooterSection from '@/app/(home)/_components/FooterSection'
import NavBar from '@/app/(home)/_components/NavBar'
import DownloadHero from '@/app/download/_components/DownloadHero'
import PreviousVersionsSection from '@/app/download/_components/PreviousVersionsSection'

export const metadata = {
  title: 'Download Steam Game Idler for Windows',
  description:
    'Download Steam Game Idler for free. Get the latest version with automatic updates, or grab a portable .zip of a previous release.',
  keywords: [
    'Steam Game Idler download',
    'download Steam Game Idler',
    'Steam Game Idler for Windows',
    'Steam Game Idler installer',
    'Steam Game Idler portable',
    'Steam Game Idler previous versions',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/download',
    siteName: 'Steam Game Idler',
    title: 'Download Steam Game Idler for Windows',
    description:
      'Download Steam Game Idler for free. Get the latest version with automatic updates, or grab a portable .zip of a previous release.',
    images: 'https://steamgameidler.com/og-image.png',
    type: 'website',
  },
  twitter: {
    title: 'Download Steam Game Idler for Windows',
    description:
      'Download Steam Game Idler for free. Get the latest version with automatic updates, or grab a portable .zip of a previous release.',
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
    </div>
  )
}
