import { FaChevronDown } from 'react-icons/fa6'

// Ported from `main` - the expand/collapse (`AnimatePresence` + `motion.div` height/opacity
// measurement) is now a pure-CSS grid-rows transition (`.pro-faq-panel`, see globals.css), which
// needs no JS-measured height.
export function FAQItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string
  a: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className='cursor-pointer overflow-hidden rounded-3xl bg-[#161616] py-2 duration-150 hover:bg-[#181818]'
      onClick={onToggle}
    >
      <div className='flex items-center justify-between gap-3 px-4 py-3.5'>
        <span className='text-lg font-semibold text-white'>{q}</span>
        <FaChevronDown
          className={`pro-faq-chevron shrink-0 text-muted ${isOpen ? 'is-open' : ''}`}
          size={16}
        />
      </div>

      <div className={`pro-faq-panel ${isOpen ? 'is-open' : ''}`}>
        <div>
          <p className='px-4 pb-4 leading-relaxed text-muted'>{a}</p>
        </div>
      </div>
    </div>
  )
}
