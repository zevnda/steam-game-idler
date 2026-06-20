import { FaChevronDown } from 'react-icons/fa6'
import { AnimatePresence, motion } from 'framer-motion'

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
      className='rounded-3xl overflow-hidden cursor-pointer py-2 bg-[#161616] hover:bg-[#181818] duration-150'
      onClick={onToggle}
    >
      <div className='flex items-center justify-between px-4 py-3.5 gap-3'>
        <span className='text-lg font-semibold'>{q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className='shrink-0'
        >
          <FaChevronDown size={16} className='text-altwhite' />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' as const }}
            className='overflow-hidden'
          >
            <p className='text-altwhite px-4 pb-4 leading-relaxed'>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
