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
