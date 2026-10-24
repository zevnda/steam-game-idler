interface AlternativeHeroProps {
  /** the competitor's name - the title reads "{competitor} vs Steam Game Idler" */
  competitor: string
  sub: string
}

/**
 * The /alternatives/[tool] pages' header: a centred title and one sentence, no buttons - the
 * comparison table starts right under it (AlternativeDetail.tsx). Set at the secondary-page title
 * size (as /alternatives, /blog, /changelog), not the home hero's. Enters as one block with
 * `.page-enter`, like every inner page's header.
 *
 * Split like the home hero's headline: a white lead line, then the closing phrase on its own line
 * in the title gradient - not one gradient across a wrapped two-line box.
 */
export default function AlternativeHero({ competitor, sub }: AlternativeHeroProps) {
  return (
    <header className='landing-container page-enter pt-36 pb-14 sm:pt-44 sm:pb-16 text-center'>
      <h1 className='max-w-4xl mx-auto text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance text-text-primary'>
        {/* the explicit space keeps the text "... vs Steam Game Idler" (not "vsSteam") for search
            and screen readers, which don't all read a <br /> as one */}
        {competitor} vs <br />
        <span className='gradient-text'>Steam Game Idler</span>
      </h1>
      <p className='mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-text-muted'>{sub}</p>
    </header>
  )
}
