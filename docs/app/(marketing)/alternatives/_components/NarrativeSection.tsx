import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import { FadeIn } from '@/app/lib/animations'

interface NarrativeSectionProps {
  competitor: Competitor
}

/**
 * Gives the heading the site's section-heading treatment - its closing phrase in the title
 * gradient, like "Ready to upgrade from <gradient>ArchiSteamFarm?</gradient>" further down. The
 * heading is data (competitors.ts), so the gradient starts at the competitor's name; a heading
 * that doesn't mention it renders plain.
 */
function gradientTail(heading: string, name: string) {
  const at = heading.lastIndexOf(name)
  if (at === -1) return heading
  return (
    <>
      {heading.slice(0, at)}
      <span className='gradient-text'>{heading.slice(at)}</span>
    </>
  )
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
          <h2
            id='narrative-heading'
            className='text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-balance text-text-primary'
          >
            {gradientTail(competitor.narrativeHeading, competitor.name)}
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
