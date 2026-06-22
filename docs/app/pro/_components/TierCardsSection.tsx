import type { ProPriceData } from '@/app/pro/_components/data'
import { FaCheck } from 'react-icons/fa6'
import { FadeIn, StaggerGroup, StaggerItem } from '@/app/lib/animations'
import { allFeatures } from '@/app/pro/_components/data'
import SectionHeading from '@/app/pro/_components/SectionHeading'
import TierCard from '@/app/pro/_components/TierCard'

interface TierCardsSectionProps {
  priceData: ProPriceData
}

export default function TierCardsSection({ priceData }: TierCardsSectionProps) {
  const casualFeatures = [
    ...allFeatures.filter(f => f.tier === 'casual').map(f => ({ title: f.title, icon: f.icon })),
    { title: 'Cancel Anytime', icon: FaCheck },
  ]
  const gamerFeatures = [
    ...allFeatures.filter(f => f.tier === 'gamer').map(f => ({ title: f.title, icon: f.icon })),
    { title: 'Cancel Anytime', icon: FaCheck },
  ]

  return (
    <section id='tiers' className='py-12 sm:py-16 relative scroll-mt-20'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='max-w-4xl mx-auto'>
          <FadeIn>
            <SectionHeading label='Choose Your Tier' />
          </FadeIn>

          <StaggerGroup className='grid md:grid-cols-2 gap-6'>
            <StaggerItem>
              <TierCard
                tier='casual'
                name='Casual'
                price={priceData.tierOne.price}
                stripeUrl={priceData.tierOne.url}
                features={casualFeatures}
              />
            </StaggerItem>
            <StaggerItem>
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
