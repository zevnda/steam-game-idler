import type { ReactElement, ReactNode } from 'react'

import Logo from '@docs/components/Logo'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import { Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'

import 'nextra-theme-docs/style.css'
import './globals.css'

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
    'The best Steam card farmer and achievement manager in 2025. Farm trading cards, manage achievements, and idle games automatically. A great alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.',
  metadataBase: new URL('https://steamgameidler.com/'),
  keywords: [
    'Steam Game Idler',
    'Steam Idler',
    'Steam Card Idler',
    'Steam Idle',
    'Steam Idlers',
    'Steam Card Farmer',
    'Steam Idling',
    'SteamIdler',
    'SteamIdle',
    'Steam Trading Card Farmer',
    'Steam Automation Tool',
    'Steam Trading Cards',
    'Steam Achievements',
    'Steam Achievement Unlocker',
    'Steam Idling Tools',
    'Steam Trading Card Idler',
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
    siteName: 'Steam Game Idler – The best alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master',
    images: 'https://steamgameidler.com/og-image.png',
    locale: 'en_US',
    type: 'article',
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
    'structured-data': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      'name': 'Steam Game Idler',
      'url': 'https://steamgameidler.com/',
      'description':
        'Farm Steam trading cards, manage achievements, and idle games automatically — an all-in-one alternative to ArchiSteamFarm, Steam Achievement Manager, and Idle Master.',
    }),
  },
  alternates: {
    canonical: './',
  },
}

const navbar = <Navbar logo={<Logo />} projectLink='https://github.com/zevnda/steam-game-idler' />

export default async function RootLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <Head
        backgroundColor={{
          light: '#fafafa',
          dark: '#101010',
        }}
      />
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
        <Analytics />
      </body>
    </html>
  )
}
