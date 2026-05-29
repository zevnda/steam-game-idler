'use client'

import { useRef, useState } from 'react'
import { TbChevronDown } from 'react-icons/tb'
import { ease } from '@docs/lib/motion'
import { AnimatePresence, motion, useInView } from 'motion/react'

const faqData = [
  {
    question: 'Do I need a Steam account to use it?',
    answer:
      'Yes, SGI connects to your existing Steam account. You authenticate through the Steam client — no passwords are ever entered into SGI itself.',
  },
  {
    question: 'Which operating systems are supported?',
    answer:
      'SGI is currently a Windows desktop application (Windows 10 and 11). macOS and Linux builds are not available at this time.',
  },
  {
    question: 'Are automation tools safe to use?',
    answer:
      'SGI uses official APIs and human-like unlock timing. As with any third-party tool, use it at your own discretion — our documentation covers best practices for minimising risk.',
  },
  {
    question: 'How does card farming work?',
    answer:
      'SGI launches games in a lightweight idle process that Steam recognises as playtime. Card drops accumulate at the same rate as normal gameplay — no Steam API tricks required.',
  },
  {
    question: 'How many games can I idle at once?',
    answer:
      'You can idle up to 32 games simultaneously, which is the maximum Steam allows. SGI lets you configure the order and timing to match your preferences.',
  },
  {
    question: 'How does achievement unlocking work?',
    answer:
      'SGI uses the official Steamworks SDK to write achievement state — the same method games use internally. The automated mode adds randomised delays between unlocks to mimic natural play.',
  },
  {
    question: "Can I lock achievements I've already earned?",
    answer:
      'Yes. You can lock any achievement you own, removing it from your profile. This is useful if you want to replay a game for the experience of earning achievements legitimately.',
  },
  {
    question: 'How do I report a bug or request a feature?',
    answer:
      'Open an issue on our GitHub repository or join the Discord server. Community feedback directly shapes what gets built next.',
  },
]

function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string
  answer: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      className='rounded-xl border border-border bg-surface cursor-pointer select-none'
      onClick={onToggle}
    >
      <div className='flex items-center justify-between gap-4 px-6 py-5'>
        <span className='font-semibold text-sm text-text-primary leading-snug'>{question}</span>
        <motion.span
          className='shrink-0 text-text-muted'
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden='true'
        >
          <TbChevronDown className='w-4 h-4' />
        </motion.span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key='answer'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            style={{ overflow: 'hidden' }}
          >
            <p className='px-6 pb-5 text-text-muted text-sm leading-relaxed'>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQSection() {
  const [openItem, setOpenItem] = useState<string | null>(null)

  const headerRef = useRef<HTMLElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  const bodyRef = useRef<HTMLDivElement>(null)
  const bodyInView = useInView(bodyRef, { once: true, margin: '-60px' })

  return (
    <section className='py-20 sm:py-24 lg:py-32 relative' aria-labelledby='faq-heading'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-3xl'>
        <motion.header
          ref={headerRef}
          className='text-center mb-12 sm:mb-16'
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
        >
          <h2
            id='faq-heading'
            className='text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight tracking-tight'
          >
            Common <span className='gradient-text'>questions</span>
          </h2>
          <p className='text-lg text-text-muted leading-relaxed max-w-xl mx-auto'>
            Everything you need to know before getting started.
          </p>
        </motion.header>

        <motion.div
          ref={bodyRef}
          className='flex flex-col gap-3'
          initial={{ opacity: 0, y: 24 }}
          animate={bodyInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
        >
          {faqData.map(({ question, answer }) => (
            <AccordionItem
              key={question}
              question={question}
              answer={answer}
              open={openItem === question}
              onToggle={() => setOpenItem(prev => (prev === question ? null : question))}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
