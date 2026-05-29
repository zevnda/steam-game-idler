import ComparisonSection from '@docs/components/home/ComparisonSection'
import CTASection from '@docs/components/home/CTASection'
import FAQSection from '@docs/components/home/FAQSection'
import FeaturesSection from '@docs/components/home/FeaturesSection'
import FooterSection from '@docs/components/home/FooterSection'
import HeroSection from '@docs/components/home/HeroSection'
import SecuritySection from '@docs/components/home/SecuritySection'
import StatsSection from '@docs/components/home/StatsSection'

export default function HomePage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='relative'>
        <HeroSection />
        <div className='section-divider' />
        <FeaturesSection />
        <div className='section-divider' />
        <ComparisonSection />
        <div className='section-divider' />
        <StatsSection />
        <div className='section-divider' />
        <SecuritySection />
        <div className='section-divider' />
        <FAQSection />
        <div className='section-divider' />
        <CTASection />
        <div className='section-divider' />
        <FooterSection />
      </div>
    </div>
  )
}
