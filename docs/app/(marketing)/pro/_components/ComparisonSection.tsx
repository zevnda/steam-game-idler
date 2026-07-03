import type { ProPriceData } from '@/app/(marketing)/pro/_components/data'
import ComparisonTable from '@/app/(marketing)/pro/_components/ComparisonTable'
import { allFeatures } from '@/app/(marketing)/pro/_components/data'
import SectionHeading from '@/app/(marketing)/pro/_components/SectionHeading'
import { FadeIn } from '@/app/lib/animations'

interface ComparisonSectionProps {
  priceData: ProPriceData
}

export default function ComparisonSection({ priceData }: ComparisonSectionProps) {
  return (
    <section className='py-12 sm:py-16 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='max-w-3xl mx-auto'>
          <FadeIn>
            <SectionHeading label='Compare Plans' />
          </FadeIn>

          <FadeIn delay={0.1}>
            <ComparisonTable
              rows={allFeatures}
              casualPrice={priceData.tierOne.price}
              gamerPrice={priceData.tierTwo.price}
            />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
