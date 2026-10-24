interface SectionHeadingProps {
  id?: string
  title: React.ReactNode
  sub?: React.ReactNode
  align?: 'center' | 'left'
}

/**
 * The landing page's one section-header pattern: tight display title, short sub.
 *
 * Deliberately not animated. Each section's content block below already reveals on scroll, so
 * the heading also fading in meant two separate entrances per section and headings that were
 * invisible until scrolled to. A heading that's simply there anchors the reveal under it.
 */
export default function SectionHeading({ id, title, sub, align = 'center' }: SectionHeadingProps) {
  const centred = align === 'center'
  // 'left' is a desktop alignment: below lg every two-column section stacks, so its heading
  // centres like the rest (as the home hero does on a phone)
  return (
    <div
      className={
        centred
          ? 'max-w-3xl mx-auto text-center'
          : 'max-w-xl mx-auto text-center lg:mx-0 lg:text-left'
      }
    >
      <h2
        id={id}
        className='text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-text-primary'
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 text-base sm:text-lg text-text-muted leading-relaxed ${centred ? 'max-w-2xl mx-auto' : 'max-w-xl mx-auto lg:mx-0'}`}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
