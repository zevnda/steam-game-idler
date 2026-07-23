import { RootProvider } from 'fumadocs-ui/provider/next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import OSDetector from '@/app/(marketing)/(home)/_components/OSDetector'
import VercelAnalytics from '@/app/(marketing)/(home)/_components/VercelAnalytics'
import SearchDialog from '@/app/(marketing)/(home)/search'
import '../globals.css'

interface LayoutProps {
  children: React.ReactNode
}

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const mono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

export const metadata = {
  title: {
    default: 'Steam Game Idler - Farm Cards, Unlock Achievements & Idle Games',
    template: '%s | Steam Game Idler',
  },
  description:
    'Free Steam automation tool to farm trading cards, unlock achievements, boost playtime, and idle games. Modern alternative to SAM, ASF, and Idle Master.',
  metadataBase: new URL('https://steamgameidler.com/'),
  keywords: [
    'Steam Game Idler',
    'Steam Idler',
    'Steam Card Idler',
    'Steam Idle',
    'Steam Card Farmer',
    'Steam Trading Card Farmer',
    'Steam Automation Tool',
    'Steam Trading Cards',
    'Steam Achievements',
    'Steam Achievement Unlocker',
    'ArchiSteamFarm Alternative',
    'Steam Achievement Manager Alternative',
    'Idle Master Alternative',
  ],
  authors: [{ name: 'zevnda', url: 'https://github.com/zevnda' }],
  creator: 'zevnda',
  generator: 'Next.js',
  applicationName: 'Steam Game Idler',
  appleWebApp: {
    title: 'Steam Game Idler',
  },
  openGraph: {
    url: 'https://steamgameidler.com',
    siteName: 'Steam Game Idler',
    images: 'https://steamgameidler.com/og-image.png',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: 'https://steamgameidler.com/',
    title:
      'Steam Game Idler – The best alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master',
    description:
      'The best Steam card farmer and achievement manager in 2026. Farm trading cards, manage achievements, and idle games automatically. A great alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.',
    image: 'https://steamgameidler.com/og-image.png',
  },
  other: {
    'msapplication-TileColor': '#fff',
    'google-site-verification': 'gOZEIhRh4BCNzE1r4etZeuJoex3aVaUrATjMnsnyYuY',
    'google-adsense-account': 'ca-pub-8915288433444527',
    'bdbfaa2fd4578c4db1970a32318ef980869bbd26': 'bdbfaa2fd4578c4db1970a32318ef980869bbd26',
    'referrer': 'strict-origin-when-cross-origin',
  },
  alternates: {
    canonical: 'https://steamgameidler.com/',
  },
}

const schemaData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Steam Game Idler',
    'url': 'https://steamgameidler.com',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Steam Game Idler',
    'url': 'https://steamgameidler.com',
    'logo': 'https://steamgameidler.com/logo.png',
    'sameAs': ['https://github.com/zevnda/steam-game-idler'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Steam Game Idler',
    'url': 'https://steamgameidler.com/',
    'description':
      'Farm Steam trading cards, manage achievements, and idle games automatically — an all-in-one alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.',
    'applicationCategory': 'UtilitiesApplication',
    'operatingSystem': 'Windows, Linux',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is a Steam achievement manager?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text':
            "A Steam achievement manager is a tool that allows you to unlock, lock, and manage achievements for Steam games. SGI's Steam achievement manager provides a safe, intuitive interface for achievement management.",
        },
      },
      {
        '@type': 'Question',
        'name': 'What is a Steam achievement unlocker?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text':
            "A Steam achievement unlocker is a tool that lets you automatically unlock Steam achievements for your games. SGI's Steam achievement unlocker uses human-like timing and methods for safety.",
        },
      },
      {
        '@type': 'Question',
        'name': 'What is a Steam idle tool?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text':
            "A Steam idle tool lets you simulate playing games to boost playtime and earn trading cards. SGI's Steam idle feature is fast, safe, and easy to use.",
        },
      },
    ],
  },
]

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang='en' className={`${geist.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev' />
        <link rel='preconnect' href='https://www.googletagmanager.com' />
        <link
          rel='preconnect'
          href='https://pagead2.googlesyndication.com'
          crossOrigin='anonymous'
        />
        <link rel='dns-prefetch' href='https://cmp.gatekeeperconsent.com' />

        <Script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />

        <Script
          src='https://www.googletagmanager.com/gtag/js?id=G-W2GWCP59BN'
          strategy='lazyOnload'
        />

        <Script id='ga-init' strategy='lazyOnload'>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-W2GWCP59BN');
          `}
        </Script>
      </head>

      <body className='flex flex-col min-h-screen'>
        <RootProvider
          search={{
            SearchDialog,
          }}
        >
          {children}
        </RootProvider>

        <VercelAnalytics />
        <OSDetector />
      </body>
    </html>
  )
}
