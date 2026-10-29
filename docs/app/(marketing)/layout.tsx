import { RootProvider } from 'fumadocs-ui/provider/next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import ClickTracker from '@/app/(marketing)/_components/ClickTracker'
import RainbowDefs from '@/app/(marketing)/_components/RainbowDefs'
import OSDetector from '@/app/(marketing)/(home)/_components/OSDetector'
import VercelAnalytics from '@/app/(marketing)/(home)/_components/VercelAnalytics'
import SearchDialog from '@/app/(marketing)/(home)/search'
import JsonLd from '@/app/lib/JsonLd'
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

export const metadata = {
  title: {
    // Leads with the brand (already #1 for it) and carries the home page's primary non-brand query,
    // "steam idler". Kept under 60 characters so it isn't truncated in results - see seo-brief.md.
    default: 'Steam Game Idler - Free Steam Idler, Card & Hour Farmer',
    template: '%s | Steam Game Idler',
  },
  description:
    'A free Steam idler for Windows and Linux. Farm trading cards and playtime hours on up to 32 games at once, unlock achievements and claim free games.',
  metadataBase: new URL('https://steamgameidler.com/'),
  // Lets Google show large image previews, which Discover effectively requires to surface a page
  // (and which also allows bigger thumbnails in regular results). A page setting its own `robots`
  // (e.g. the noindexed checkout returns) replaces this whole object, so those stay unaffected.
  robots: {
    index: true,
    follow: true,
    googleBot: { 'index': true, 'follow': true, 'max-image-preview': 'large' },
  },
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
  // No `site`: that field takes an @handle, and the project has no X/Twitter account. Title and
  // description fall back to the page's own, so cards stay in sync with the search snippet.
  twitter: {
    card: 'summary_large_image',
    image: 'https://steamgameidler.com/og-image.png',
  },
  other: {
    'msapplication-TileColor': '#fff',
    'google-site-verification': 'gOZEIhRh4BCNzE1r4etZeuJoex3aVaUrATjMnsnyYuY',
    // 'google-adsense-account': 'ca-pub-8915288433444527',
    'bdbfaa2fd4578c4db1970a32318ef980869bbd26': 'bdbfaa2fd4578c4db1970a32318ef980869bbd26',
    'referrer': 'strict-origin-when-cross-origin',
  },
  alternates: {
    canonical: 'https://steamgameidler.com/',
  },
}

// Site-wide structured data only. The home page's SoftwareApplication + FAQPage live in
// (home)/page.tsx: this layout wraps every marketing and docs page, and FAQ markup must describe
// a FAQ that's actually visible on the page it's on.
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
]

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang='en' className={`${geist.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://cdn-steamgameidler.com' />
        <link rel='preconnect' href='https://www.googletagmanager.com' />

        <JsonLd data={schemaData} />

        <Script
          src='https://www.googletagmanager.com/gtag/js?id=G-W2GWCP59BN'
          strategy='lazyOnload'
        />

        {/* Only the tag download is deferred: the init runs early so the dataLayer queue (and the
            `config` command) exists before any custom event from app/lib/analytics.ts is pushed */}
        <Script id='ga-init' strategy='afterInteractive'>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-W2GWCP59BN');
          `}
        </Script>
      </head>

      <body className='flex flex-col min-h-screen'>
        {/* The site is designed dark-only (the docs' theme switch is disabled too). Without
            forcing it, next-themes follows the visitor's OS setting, so light-mode visitors got
            white docs pages and mis-coloured text on dark-styled components. */}
        <RootProvider
          search={{
            SearchDialog,
          }}
          theme={{ forcedTheme: 'dark', defaultTheme: 'dark', enableSystem: false }}
        >
          {children}
        </RootProvider>

        <RainbowDefs />
        <VercelAnalytics />
        <ClickTracker />
        <OSDetector />
      </body>
    </html>
  )
}
