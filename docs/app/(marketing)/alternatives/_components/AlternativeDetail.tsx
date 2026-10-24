import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import FinalCta from '@/app/(marketing)/(home)/_components/landing/FinalCta'
import AlternativeComparisonTable from '@/app/(marketing)/alternatives/_components/AlternativeComparisonTable'
import AlternativeHero from '@/app/(marketing)/alternatives/_components/AlternativeHero'
import NarrativeSection from '@/app/(marketing)/alternatives/_components/NarrativeSection'
import WhyChooseSection from '@/app/(marketing)/alternatives/_components/WhyChooseSection'

interface AlternativeDetailProps {
  competitor: Competitor
}

/**
 * Everything between the nav and the footer on an /alternatives/[tool] page. The three pages
 * differ only in their competitor data and metadata, so the body lives here once. Section rhythm
 * matches the home page: `landing-section` spacing and a glow divider between sections.
 */
export default function AlternativeDetail({ competitor }: AlternativeDetailProps) {
  return (
    <main>
      <AlternativeHero competitor={competitor.name} sub={competitor.intro} />

      {/* The table follows the header directly - the header already says what it compares. Only
          bottom padding (landing-section's), so it sits close under the header. */}
      <section aria-label='Feature comparison' className='pb-[clamp(5rem,11vw,9.5rem)]'>
        <div className='landing-container'>
          <div className='max-w-5xl mx-auto'>
            <AlternativeComparisonTable competitor={competitor} />
          </div>
        </div>
      </section>

      <NarrativeSection competitor={competitor} />

      <WhyChooseSection competitor={competitor} />

      <FinalCta
        title={
          <>
            Ready to upgrade from <span className='gradient-text'>{competitor.name}?</span>
          </>
        }
        sub={competitor.ctaDescription}
      />
    </main>
  )
}
