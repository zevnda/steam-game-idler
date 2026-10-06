import { FadeIn } from '@/app/lib/animations'

interface SectionHeadingProps {
  id?: string
  eyebrow: string
  title: React.ReactNode
  sub?: React.ReactNode
  align?: 'center' | 'left'
}

/** The landing page's one section-header pattern: mono eyebrow, tight display title, short sub. */
export default function SectionHeading({
  id,
  eyebrow,
  title,
  sub,
  align = 'center',
}: SectionHeadingProps) {
  const centred = align === 'center'
  return (
    <FadeIn className={centred ? 'max-w-3xl mx-auto text-center' : 'max-w-xl'}>
      <p className='font-mono text-[11px] sm:text-xs uppercase tracking-[0.24em] text-text-muted'>
        {eyebrow}
      </p>
      <h2
        id={id}
        className='mt-4 text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-text-primary'
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 text-base sm:text-lg text-text-muted leading-relaxed ${centred ? 'max-w-2xl mx-auto' : ''}`}
        >
          {sub}
        </p>
      )}
    </FadeIn>
  )
}
