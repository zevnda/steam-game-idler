'use client'

import { FaArrowDown } from 'react-icons/fa6'
import { allFeatures } from '@/app/(marketing)/pro/_components/data'
import FeatureCard from '@/app/(marketing)/pro/_components/FeatureCard'
import SectionHeading from '@/app/(marketing)/pro/_components/SectionHeading'
import { FadeIn, StaggerGroup, StaggerItem } from '@/app/lib/animations'

export default function FeaturesSection() {
  const bentoFeatures = allFeatures.filter(f => f.imgBg)

  return (
    <section className='py-12 sm:py-16 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='max-w-5xl mx-auto'>
          <FadeIn>
            <SectionHeading label='Top Features' />
          </FadeIn>

          <StaggerGroup className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'>
            {bentoFeatures.map((f, i) => (
              <StaggerItem
                key={f.title}
                // 9 cards is even at 3-up (`lg`+) and at 1-up (below `sm`), but odd at 2-up
                // (`sm` to `lg`), leaving a single dangling card on its own row - drop the last
                // card in that range so the 2-up grid always fills full rows. Mirrors
                // src/shared/components/pro/GoProModal/index.tsx's identical fix.
                className={`h-full ${i === bentoFeatures.length - 1 ? 'sm:max-lg:hidden' : ''}`}
              >
                <FeatureCard feature={f} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          <div className='flex justify-center'>
            <a
              href='#compare'
              onClick={e => {
                e.preventDefault()
                document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className='mt-8 inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-white text-black font-black uppercase cursor-pointer transition-transform duration-150 hover:scale-105'
            >
              View All Features
              <FaArrowDown className='w-3 h-3' />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
