import type { ProPriceData } from '@/app/(marketing)/pro/_components/data'
import { FaCheck } from 'react-icons/fa6'
import { allFeatures } from '@/app/(marketing)/pro/_components/data'
import SectionHeading from '@/app/(marketing)/pro/_components/SectionHeading'
import TierCard from '@/app/(marketing)/pro/_components/TierCard'
import { FadeIn, StaggerGroup, StaggerItem } from '@/app/lib/animations'

interface TierCardsSectionProps {
  priceData: ProPriceData
}

export default function TierCardsSection({ priceData }: TierCardsSectionProps) {
  const casualFeatures = [
    ...allFeatures
      .filter(f => f.tier === 'casual')
      .map(f => ({ title: f.tierLabel ?? f.title, icon: f.icon })),
    { title: 'Cancel Anytime', icon: FaCheck },
  ]
  const gamerFeatures = [
    ...allFeatures
      .filter(f => f.tier === 'gamer')
      .map(f => ({ title: f.tierLabel ?? f.title, icon: f.icon })),
    { title: 'Cancel Anytime', icon: FaCheck },
  ]

  return (
    <section id='tiers' className='py-12 sm:py-16 relative scroll-mt-20'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='max-w-4xl mx-auto'>
          <FadeIn>
            <SectionHeading label='Choose Your Tier' />
          </FadeIn>

          <StaggerGroup className='grid md:grid-cols-2 gap-6 items-stretch'>
            <StaggerItem className='h-full'>
              <TierCard
                tier='casual'
                name='Casual'
                price={priceData.tierOne.price}
                stripeUrl={priceData.tierOne.url}
                features={casualFeatures}
              />
            </StaggerItem>
            <StaggerItem className='h-full'>
              <TierCard
                tier='gamer'
                name='Gamer'
                price={priceData.tierTwo.price}
                stripeUrl={priceData.tierTwo.url}
                features={gamerFeatures}
                isMostPopular
              />
            </StaggerItem>
          </StaggerGroup>

          <p className='text-center text-text-muted text-xs mt-6 max-w-md mx-auto'>
            Prices displayed are in USD and exclude taxes and currency conversion fees which may
            apply depending on your location and payment method.
          </p>
        </div>
      </div>
    </section>
  )
}
