import type { ReactElement, ReactNode } from 'react'

import Logo from '@docs/components/Logo'
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
    default: 'Steam Game Idler – Trading Card Farmer & Achievement Unlocker',
    template: '%s | Steam Game Idler',
  },
  description: 'Effortlessly farm Steam trading cards and unlock achievements with our modern, user-friendly tool.',
  metadataBase: new URL('https://steamgameidler.vercel.app/'),
  keywords: [
    'Steam Game Idler',
    'Steam Idler',
    'Steam Card Idler',
    'Steam Automation',
    'Steam Trading Cards',
    'Steam Achievements',
    'Steam Achievement Unlocker',
    'Steam Idling Tools',
  ],
  authors: [{ name: 'zevnda', url: 'https://github.com/zevnda' }],
  creator: 'zevnda',
  generator: 'Next.js',
  applicationName: 'Steam Game Idler',
  appleWebApp: {
    title: 'Steam Game Idler',
  },
  openGraph: {
    url: 'https://steamgameidler.vercel.app',
    siteName: 'Steam Game Idler',
    images: 'https://steamgameidler.vercel.app/og-image.png',
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    site: 'https://steamgameidler.vercel.app/',
    title: 'Steam Game Idler',
    description: 'Effortlessly farm Steam trading cards and unlock achievements with our modern, user-friendly tool.',
    image: 'https://steamgameidler.vercel.app/og-image.png',
  },
  other: {
    'msapplication-TileColor': '#fff',
    'google-site-verification': 'gOZEIhRh4BCNzE1r4etZeuJoex3aVaUrATjMnsnyYuY',
    'structured-data': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      'name': 'Steam Game Idler',
      'url': 'https://steamgameidler.vercel.app/',
      'description':
        'Effortlessly farm Steam trading cards and unlock achievements with our modern, user-friendly tool.',
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
      </body>
    </html>
  )
}
