import ComparisonSection from '@/app/(home)/_components/ComparisonSection'
import CTASection from '@/app/(home)/_components/CTASection'
import FAQSection from '@/app/(home)/_components/FAQSection'
import FeaturesSection from '@/app/(home)/_components/FeaturesSection'
import FooterSection from '@/app/(home)/_components/FooterSection'
import HeroSection from '@/app/(home)/_components/HeroSection'
import NavBar from '@/app/(home)/_components/NavBar'
import SecuritySection from '@/app/(home)/_components/SecuritySection'
import StatsSection from '@/app/(home)/_components/StatsSection'

export default function HomePage() {
  return (
    <div className='min-h-screen bg-background'>
      <NavBar />
      <div className='relative'>
        <HeroSection />
        <div className='section-divider' />
        <div id='features'>
          <FeaturesSection />
        </div>
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
