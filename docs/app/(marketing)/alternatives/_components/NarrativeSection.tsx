import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import SectionHeading from '@/app/(marketing)/pro/_components/SectionHeading'
import { FadeIn } from '@/app/lib/animations'

interface NarrativeSectionProps {
  competitor: Competitor
}

export default function NarrativeSection({ competitor }: NarrativeSectionProps) {
  return (
    <div className='max-w-3xl mx-auto'>
      <FadeIn>
        <SectionHeading label={competitor.narrativeHeading} />
      </FadeIn>
      <FadeIn className='text-center'>
        {competitor.narrativeParagraphs.map(paragraph => (
          <p key={paragraph} className='text-text-muted leading-relaxed mb-4 last:mb-0'>
            {paragraph}
          </p>
        ))}
      </FadeIn>
    </div>
  )
}
