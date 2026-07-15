import type { ProPriceData } from '@/app/(marketing)/pro/_components/data'
import { FaCheck, FaDiscord } from 'react-icons/fa6'
import {
  TbAd,
  TbAward,
  TbCards,
  TbClock,
  TbCurrencyDollar,
  TbGift,
  TbHeadset,
  TbKey,
  TbPalette,
  TbPhoto,
  TbRefresh,
  TbTypography,
  TbUserCircle,
  TbUsers,
} from 'react-icons/tb'
import SectionHeading from '@/app/(marketing)/pro/_components/SectionHeading'
import TierCard from '@/app/(marketing)/pro/_components/TierCard'
import { FadeIn, StaggerGroup, StaggerItem } from '@/app/lib/animations'

interface TierCardsSectionProps {
  priceData: ProPriceData
}

// Both lists below are hand-maintained to mirror src/shared/components/pro/GoProModal/index.tsx's
// two TierCard `features=` arrays field-for-field (same order - which itself matches that file's
// data.ts's getComparisonRows order) rather than derived from `allFeatures.filter()` - a filter
// inherits `allFeatures`' own bento-grid-oriented order, which is why this previously drifted out
// of sync with GoProModal (and once silently dropped Custom Steam Status entirely). When
// GoProModal's index.tsx feature lists change, copy the row order here and swap each `t('proMode.
// xxx')` call for the plain English string from src/i18n/locales/en-US.json.
export default function TierCardsSection({ priceData }: TierCardsSectionProps) {
  const casualFeatures = [
    { title: '3 Concurrent Accounts', icon: TbUsers },
    { title: 'Unlock 3 Games At Once', icon: TbAward },
    { title: 'Automatic Games List Updates', icon: TbRefresh },
    { title: 'Ad-Free Experience', icon: TbAd },
    { title: 'Exclusive Themes', icon: TbPalette },
    { title: 'Custom Background Image', icon: TbPhoto },
    { title: 'Custom Fonts', icon: TbTypography },
    { title: 'Discord PRO Role', icon: FaDiscord },
    { title: 'Real-Time Live Support', icon: TbHeadset },
    { title: 'Cancel Anytime', icon: FaCheck },
  ]
  const gamerFeatures = [
    { title: '10 Concurrent Accounts', icon: TbUsers },
    { title: 'Unlock 32 Games At Once', icon: TbAward },
    { title: 'Automatic Steam Credentials Retrieval', icon: TbKey },
    { title: 'Automatic Free Game Redemption', icon: TbGift },
    { title: 'Automatic Card Farming', icon: TbCards },
    { title: 'Sell Duplicate Inventory Items', icon: TbCurrencyDollar },
    { title: 'Import Achievement Unlock Timings', icon: TbClock },
    { title: 'Custom Steam Status', icon: TbUserCircle },
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
