import { Suspense } from 'react'
import AdScripts from '@/app/(marketing)/(home)/_components/AdScripts'
import AdSlot from '@/app/(marketing)/(home)/_components/AdSlot'
import Community from '@/app/(marketing)/(home)/_components/landing/Community'
import Compare from '@/app/(marketing)/(home)/_components/landing/Compare'
import Faq from '@/app/(marketing)/(home)/_components/landing/Faq'
import FeatureBento from '@/app/(marketing)/(home)/_components/landing/FeatureBento'
import FinalCta from '@/app/(marketing)/(home)/_components/landing/FinalCta'
import GetStarted from '@/app/(marketing)/(home)/_components/landing/GetStarted'
import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import OpenSource from '@/app/(marketing)/(home)/_components/landing/OpenSource'
import Showcase from '@/app/(marketing)/(home)/_components/landing/showcase/Showcase'

// Each below-the-fold section sits in its own <Suspense> boundary so React hydrates them as
// separate, interruptible tasks instead of one long one (keeps Total Blocking Time / INP down -
// this page is measured against the old one in Search Console).
export default function HomePage() {
  return (
    <div className='landing min-h-screen bg-background'>
      <AdScripts />
      <LandingNav />
      <main>
        {/* Hero + live 3D playground (pinned). No ad inside it - an ad block scrolling over the
            pinned stage would break the hand-over from hero to playground. */}
        <Showcase />
        <div className='section-divider' />
        <AdSlot slot='1265004536' />
        <Suspense>
          <FeatureBento />
        </Suspense>
        <div className='section-divider' />
        <AdSlot slot='3005445709' />
        <Suspense>
          <GetStarted />
        </Suspense>
        <div className='section-divider' />
        <AdSlot slot='9143494556' />
        <Suspense>
          <Compare />
        </Suspense>
        <div className='section-divider' />
        <AdSlot slot='9100790437' />
        <Suspense>
          <Community />
        </Suspense>
        <div className='section-divider' />
        <Suspense>
          <OpenSource />
        </Suspense>
        <div className='section-divider' />
        <AdSlot slot='2284296837' />
        <Suspense>
          <Faq />
        </Suspense>
        <div className='section-divider' />
        <AdSlot slot='3052629191' />
        <Suspense>
          <FinalCta />
        </Suspense>
        <div className='section-divider' />
      </main>
      <Suspense>
        <LandingFooter />
      </Suspense>
    </div>
  )
}
