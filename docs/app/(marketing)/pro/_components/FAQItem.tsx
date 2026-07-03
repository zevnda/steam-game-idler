import { FaChevronDown } from 'react-icons/fa6'
import { AnimatePresence, motion } from 'motion/react'

interface FAQItemProps {
  q: string
  a: string
  isOpen: boolean
  onToggle: () => void
}

export default function FAQItem({ q, a, isOpen, onToggle }: FAQItemProps) {
  return (
    <div
      className='rounded-3xl overflow-hidden cursor-pointer bg-[#161616] hover:bg-[#181818] transition-colors duration-150'
      onClick={onToggle}
    >
      <div className='flex items-center justify-between px-5 py-4 gap-3'>
        <span className='text-sm sm:text-base font-semibold text-text-primary'>{q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className='shrink-0'
        >
          <FaChevronDown className='w-4 h-4 text-text-muted' />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <p className='text-text-muted text-sm leading-relaxed px-5 pb-4'>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
