import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import { FadeIn } from '@/app/lib/animations'

interface NarrativeSectionProps {
  competitor: Competitor
}

/**
 * The comparison written out as prose, in the home page's two-column layout (OpenSource.tsx:
 * heading left, content right). Its heading is a full search question ("How does Steam Game
 * Idler compare to ...?"), so it's set a size down from SectionHeading to keep it compact.
 */
export default function NarrativeSection({ competitor }: NarrativeSectionProps) {
  return (
    <section aria-labelledby='narrative-heading' className='landing-section'>
      <div className='landing-container grid lg:grid-cols-2 gap-10 lg:gap-20 items-start'>
        <div className='max-w-xl mx-auto text-center lg:mx-0 lg:text-left'>
          <p className='font-mono text-[11px] sm:text-xs uppercase tracking-[0.24em] text-text-muted'>
            In detail
          </p>
          <h2
            id='narrative-heading'
            className='mt-4 text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-balance text-text-primary'
          >
            {competitor.narrativeHeading}
          </h2>
        </div>
        {/* centred under the centred heading until the two columns appear at lg */}
        <FadeIn className='text-center lg:text-left'>
          {competitor.narrativeParagraphs.map(paragraph => (
            <p
              key={paragraph}
              className='text-base sm:text-lg text-text-muted leading-relaxed mb-5 last:mb-0'
            >
              {paragraph}
            </p>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}
