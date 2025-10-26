import type { ReactElement, ReactNode } from 'react'

import Logo from '@docs/components/Logo'
import { Inter } from 'next/font/google'
import { Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'

import 'nextra-theme-docs/style.css'
import './globals.css'

import AdOverlay from '@docs/components/AdOverlay'
import AnalyticsLoader from '@docs/components/AnalyticsLoader'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata = {
  title: {
    default: 'Steam Game Idler – The best alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master',
    template: '%s | Steam Game Idler',
  },
  description:
    'The best Steam idle tool featuring a trading card farmer, achievement unlocker, and game idler. Free alternative to ArchiSteamFarm, Steam Achievement Manager, Idle Master.',
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
    title: 'Steam Game Idler – The best alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master',
    description:
      'The best Steam card farmer and achievement manager in 2025. Farm trading cards, manage achievements, and idle games automatically. A great alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.',
    image: 'https://steamgameidler.com/og-image.png',
  },
  other: {
    'msapplication-TileColor': '#fff',
    'google-site-verification': 'gOZEIhRh4BCNzE1r4etZeuJoex3aVaUrATjMnsnyYuY',
    'google-adsense-account': 'ca-pub-8915288433444527',
  },
  alternates: {
    canonical: './',
  },
}

const schemaData = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Steam Game Idler',
    'url': 'https://steamgameidler.com/',
    'description':
      'Farm Steam trading cards, manage achievements, and idle games automatically — an all-in-one alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.',
    'applicationCategory': 'UtilitiesApplication',
    'operatingSystem': 'Windows',
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

const navbar = <Navbar logo={<Logo />} projectLink='https://github.com/zevnda/steam-game-idler' />

export default async function RootLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <Head
        backgroundColor={{
          light: '#fafafa',
          dark: '#101010',
        }}
      >
        <script
          async
          src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8915288433444527'
          crossOrigin='anonymous'
        />
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      </Head>
      <body className={`${inter.className} text-sm`}>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase='https://github.com/zevnda/steam-game-idler/tree/main/docs'
          editLink='Edit on GitHub'
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: false,
          }}
          footer={<div />}
          feedback={{ content: 'Give us feedback' }}
        >
          {children}
        </Layout>
        <AdOverlay />
        <AnalyticsLoader />
      </body>
    </html>
  )
}
