import AdOverlay from '@/app/(home)/_components/AdOverlay'
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
        <AdOverlay slot='1265004536' />
        <div id='features'>
          <FeaturesSection />
        </div>
        <div className='section-divider' />
        <AdOverlay slot='3005445709' />
        <ComparisonSection />
        <div className='section-divider' />
        <AdOverlay slot='9143494556' />
        <StatsSection />
        <div className='section-divider' />
        <AdOverlay slot='9100790437' />
        <SecuritySection />
        <div className='section-divider' />
        <AdOverlay slot='2284296837' />
        <FAQSection />
        <div className='section-divider' />
        <AdOverlay slot='3052629191' />
        <CTASection />
        <div className='section-divider' />
        <FooterSection />
      </div>
    </div>
  )
}
