import type { ReactNode } from 'react'
import { useId } from 'react'
import { FaChevronDown } from 'react-icons/fa6'
import { cn } from '@heroui/react'

const VARIANTS = {
  // The Go Pro modal's fixed dark look, which stays the same under every theme
  pro: {
    card: 'rounded-3xl bg-[#161616] py-2 hover:bg-[#181818]',
    header: 'px-4 py-3.5',
    question: 'text-lg font-semibold text-white',
    chevronSize: 16,
    answer: 'px-4 pb-4 leading-relaxed text-muted',
  },
  // Settings > Help: the theme's own card colours and the settings area's smaller type
  settings: {
    card: 'rounded-xl bg-surface hover:bg-surface-hover',
    header: 'px-4 py-3',
    question: 'text-sm font-semibold text-foreground',
    chevronSize: 12,
    answer: 'px-4 pb-4 text-sm leading-relaxed text-muted',
  },
}

// One expandable question. The expand/collapse is a pure-CSS grid-rows transition (`.faq-panel`, see
// globals.css), which needs no JS-measured height. Only the question toggles it, so text in an open
// answer can be selected and its links clicked without closing it.
export function FAQItem({
  q,
  a,
  footer,
  isOpen,
  onToggle,
  variant = 'pro',
}: {
  q: string
  a: string
  footer?: ReactNode
  isOpen: boolean
  onToggle: () => void
  variant?: keyof typeof VARIANTS
}) {
  const panelId = useId()
  const styles = VARIANTS[variant]

  return (
    <div className={cn('overflow-hidden duration-150', styles.card)}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset',
          styles.header,
        )}
        type='button'
        onClick={onToggle}
      >
        <span className={styles.question}>{q}</span>
        <FaChevronDown
          className={cn('faq-chevron shrink-0 text-muted', isOpen && 'is-open')}
          size={styles.chevronSize}
        />
      </button>

      {/* `inert` while closed: the panel only collapses visually, so a link inside it could
          otherwise still take keyboard focus. */}
      <div className={cn('faq-panel', isOpen && 'is-open')} id={panelId} inert={!isOpen}>
        <div>
          {/* `pre-line` so an answer's line breaks show, which is how its lists are written */}
          <div className={cn('whitespace-pre-line', styles.answer)}>
            {a}
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
