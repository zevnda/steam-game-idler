'use client'

import type { ReactElement } from 'react'

import ComparisonSection from '@docs/components/landing/ComparisonSection'
import CTASection from '@docs/components/landing/CTASection'
import FAQSection from '@docs/components/landing/FAQSection'
import FeaturesSection from '@docs/components/landing/FeaturesSection'
import FooterSection from '@docs/components/landing/FooterSection'
import HeroSection from '@docs/components/landing/HeroSection'
import SecuritySection from '@docs/components/landing/SecuritySection'
import StatsSection from '@docs/components/landing/StatsSection'

export default function Home(): ReactElement {
  return (
    <div className='min-h-screen bg-linear-to-b from-white to-gray-100 overflow-x-hidden'>
      <div className='relative'>
        <HeroSection />
        <FeaturesSection />
        <ComparisonSection />
        <FAQSection />
        <SecuritySection />
        <StatsSection />
        <CTASection />
        <FooterSection />
      </div>
    </div>
  )
}
