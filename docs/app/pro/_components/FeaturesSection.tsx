import { FadeIn, StaggerGroup, StaggerItem } from '@/app/lib/animations'
import { allFeatures } from '@/app/pro/_components/data'
import FeatureCard from '@/app/pro/_components/FeatureCard'
import SectionHeading from '@/app/pro/_components/SectionHeading'

export default function FeaturesSection() {
  const bentoFeatures = allFeatures.filter(f => f.imgBg)

  return (
    <section className='py-12 sm:py-16 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='max-w-5xl mx-auto'>
          <FadeIn>
            <SectionHeading label='All Features' />
          </FadeIn>

          <StaggerGroup className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'>
            {bentoFeatures.map(f => (
              <StaggerItem key={f.title} className='h-full'>
                <FeatureCard feature={f} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  )
}
