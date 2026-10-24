import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import SectionHeading from '@/app/(marketing)/(home)/_components/landing/SectionHeading'
import { StaggerGroup, StaggerItem } from '@/app/lib/animations'

// one glow hue per card position, from the home bento's palette (landing/features.ts)
const ACCENTS = ['#34d399', '#f0abfc', '#facc15']

interface WhyChooseSectionProps {
  competitor: Competitor
}

/** Reasons to switch, on the home page's bento surfaces (`.bento-tile`, FeatureBento.tsx). */
export default function WhyChooseSection({ competitor }: WhyChooseSectionProps) {
  return (
    <section aria-labelledby='why-heading' className='landing-section'>
      <div className='landing-container'>
        <SectionHeading
          id='why-heading'
          title={
            <>
              Why people <span className='gradient-text'>switch.</span>
            </>
          }
          sub={competitor.whyChooseSummary}
        />

        <StaggerGroup className='mt-16 grid sm:grid-cols-3 gap-4'>
          {competitor.whyChooseCards.map((card, i) => (
            <StaggerItem key={card.title} className='h-full'>
              <article
                className='bento-tile'
                style={{ '--accent': ACCENTS[i % ACCENTS.length] } as React.CSSProperties}
              >
                <div className='relative p-7 sm:p-8'>
                  <h3 className='text-lg font-semibold text-text-primary'>{card.title}</h3>
                  <p className='mt-2 text-base text-text-muted leading-relaxed'>
                    {card.description}
                  </p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
