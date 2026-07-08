import AdOverlay from '@/app/(marketing)/(home)/_components/AdOverlay'
import AdScripts from '@/app/(marketing)/(home)/_components/AdScripts'
import ComparisonSection from '@/app/(marketing)/(home)/_components/ComparisonSection'
import CTASection from '@/app/(marketing)/(home)/_components/CTASection'
import FAQSection from '@/app/(marketing)/(home)/_components/FAQSection'
import FeaturesSection from '@/app/(marketing)/(home)/_components/FeaturesSection'
import FooterSection from '@/app/(marketing)/(home)/_components/FooterSection'
import HeroSection from '@/app/(marketing)/(home)/_components/HeroSection'
import NavBar from '@/app/(marketing)/(home)/_components/NavBar'
import SecuritySection from '@/app/(marketing)/(home)/_components/SecuritySection'
import StatsSection from '@/app/(marketing)/(home)/_components/StatsSection'

export default function HomePage() {
  return (
    <div className='min-h-screen bg-background'>
      <AdScripts />
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
