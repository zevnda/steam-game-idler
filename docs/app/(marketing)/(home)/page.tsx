import { Suspense } from 'react'
import Community from '@/app/(marketing)/(home)/_components/landing/Community'
import Compare from '@/app/(marketing)/(home)/_components/landing/Compare'
import Faq from '@/app/(marketing)/(home)/_components/landing/Faq'
import { FAQ } from '@/app/(marketing)/(home)/_components/landing/faqData'
import FeatureBento from '@/app/(marketing)/(home)/_components/landing/FeatureBento'
import FinalCta from '@/app/(marketing)/(home)/_components/landing/FinalCta'
import GetStarted from '@/app/(marketing)/(home)/_components/landing/GetStarted'
import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import LatestPosts from '@/app/(marketing)/(home)/_components/landing/LatestPosts'
import OpenSource from '@/app/(marketing)/(home)/_components/landing/OpenSource'
import Showcase from '@/app/(marketing)/(home)/_components/landing/showcase/Showcase'
import JsonLd from '@/app/lib/JsonLd'

// Home-page-only structured data (site-wide WebSite/Organization stay in the marketing layout).
// Only verifiable facts: no aggregateRating/review, since there are no real ratings to cite - which
// also means Google won't show a software rich result for this block, by design.
const softwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': 'Steam Game Idler',
  'alternateName': 'SGI',
  'url': 'https://steamgameidler.com/',
  'description':
    'Steam Game Idler is a free Steam idler for Windows and Linux. It farms trading cards, boosts playtime hours, unlocks and manages achievements, sells inventory items and claims free games, for up to 32 games at once.',
  'applicationCategory': 'UtilitiesApplication',
  'operatingSystem': 'Windows 10, Windows 11, Linux',
  'downloadUrl': 'https://steamgameidler.com/download',
  'image': 'https://steamgameidler.com/og-image.png',
  'screenshot': 'https://cdn-steamgameidler.com/example_v2.webp',
  'featureList': [
    'Trading card farming, up to 32 games at once',
    'Playtime booster',
    'Automatic achievement unlocker with human-like delays',
    'Achievement and stats manager',
    'Inventory Manager for the Steam Community Market',
    'Free game alerts and claiming',
    'Multiple Steam accounts',
  ],
  'isAccessibleForFree': true,
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'USD',
  },
  'author': {
    '@type': 'Person',
    'name': 'zevnda',
    'url': 'https://github.com/zevnda',
  },
  'publisher': {
    '@type': 'Organization',
    'name': 'Steam Game Idler',
    'url': 'https://steamgameidler.com',
  },
  'sameAs': ['https://github.com/zevnda/steam-game-idler'],
}

// Built from the same data the visible FAQ section renders, so the two can't drift apart. FAQ rich
// results are retired, but the markup still describes the page's Q&A to search and AI crawlers.
const faqPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': FAQ.map(({ question, answer }) => ({
    '@type': 'Question',
    'name': question,
    'acceptedAnswer': { '@type': 'Answer', 'text': answer },
  })),
}

// Each below-the-fold section sits in its own <Suspense> boundary so React hydrates them as
// separate, interruptible tasks instead of one long one (keeps Total Blocking Time / INP down -
// this page is measured against the old one in Search Console).
export default function HomePage() {
  return (
    <div className='landing min-h-screen bg-background'>
      <JsonLd data={[softwareApplication, faqPage]} />
      <LandingNav />
      <main>
        {/* Hero + live 3D playground (pinned). Keep anything else out of it - a block scrolling
            over the pinned stage would break the hand-over from hero to playground. */}
        <Showcase />
        <Suspense>
          <FeatureBento />
        </Suspense>
        <Suspense>
          <GetStarted />
        </Suspense>
        <Suspense>
          <Compare />
        </Suspense>
        <Suspense>
          <Community />
        </Suspense>
        <Suspense>
          <OpenSource />
        </Suspense>
        <Suspense>
          <Faq />
        </Suspense>
        {/* Newest blog posts: a discovery path from the strongest page to new posts. Kept below the
            FAQ so nothing the home page ranks for moves. Renders nothing while there are no posts. */}
        <Suspense>
          <LatestPosts />
        </Suspense>
        <Suspense>
          <FinalCta />
        </Suspense>
      </main>
      <Suspense>
        <LandingFooter />
      </Suspense>
    </div>
  )
}
