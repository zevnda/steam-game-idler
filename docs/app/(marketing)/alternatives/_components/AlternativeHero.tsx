interface AlternativeHeroProps {
  title: string
  sub: string
}

/**
 * The /alternatives/[tool] pages' header: a centred title and one sentence, no buttons - the
 * comparison table starts right under it (AlternativeDetail.tsx). Set at the secondary-page title
 * size (as /alternatives, /blog, /changelog), not the home hero's. Enters as one block with
 * `.page-enter`, like every inner page's header.
 */
export default function AlternativeHero({ title, sub }: AlternativeHeroProps) {
  return (
    <header className='landing-container page-enter pt-36 pb-14 sm:pt-44 sm:pb-16 text-center'>
      <h1 className='max-w-4xl mx-auto text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance text-text-primary'>
        {title}
      </h1>
      <p className='mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-text-muted'>{sub}</p>
    </header>
  )
}
