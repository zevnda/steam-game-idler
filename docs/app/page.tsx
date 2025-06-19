'use client'

import type { ReactElement } from 'react'

import CTASection from '@docs/components/landing/CTASection'
import FeaturesSection from '@docs/components/landing/FeaturesSection'
import FooterSection from '@docs/components/landing/FooterSection'
import HeroSection from '@docs/components/landing/HeroSection'
import SecuritySection from '@docs/components/landing/SecuritySection'
import StatsSection from '@docs/components/landing/StatsSection'

export default function Home(): ReactElement {
  return (
    <div className='min-h-screen bg-black text-white overflow-hidden'>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <SecuritySection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
