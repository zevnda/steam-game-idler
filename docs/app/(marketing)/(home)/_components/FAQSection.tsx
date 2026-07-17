'use client'

import { useRef, useState } from 'react'
import { FiArrowUpRight } from 'react-icons/fi'
import { TbChevronDown } from 'react-icons/tb'
import { AnimatePresence, motion, useInView } from 'motion/react'
import Link from 'next/link'
import { ease } from '@/app/lib/motion'

const faqData = [
  {
    question: 'Do I need a Steam account to use SGI?',
    answer:
      'SGI gives you two ways to sign in. "Sign in with Steam" is the recommended method and needs no local Steam client at all - you sign in with your Steam username/password or a QR code. "Legacy Sign In" is the fallback for anyone who\'d rather not enter Steam credentials into SGI - it requires the Steam client to be installed, running, and already signed in.',
  },
  {
    question: 'Do I need to give SGI my username or password?',
    answer:
      'Only if you choose "Sign in with Steam", the recommended method - your credentials are sent directly to Steam\'s own servers, the same as signing in through the official Steam client, and SGI never sees or stores your password. If you\'d rather not enter your username/password at all, use "Legacy Sign In" instead, which reads the account(s) already signed in through a running local Steam client.',
  },
  {
    question: 'What makes SGI different from other tools?',
    answer:
      'Instead of forcing you to manage separate tools for different tasks, SGI combines them into a single, modern desktop app with a clean, user-friendly interface, and no complex configuration files.',
  },
  {
    question: 'Which operating systems are supported?',
    answer:
      'SGI is currently a Windows desktop application (Windows 10 and 11). macOS and Linux builds are not available at this time.',
  },
  {
    question: 'Are automation tools safe to use?',
    answer:
      'Historically, Steam does not ban accounts simply for using automation tools. SGI uses the official Steam API and SDK like many legitimate games do. Use it at your own discretion.',
  },
  {
    question: 'How does SGI farm trading cards?',
    answer:
      'SGI launches games in a lightweight idle process that Steam recognizes as a running game. Card drops accumulate at the same rate as they would during normal gameplay.',
  },
  {
    question: 'How does SGI unlock achievements for games?',
    answer:
      "SGI uses the official Steamworks SDK to update a game's achievement states. This is the same method lots of legitimate games use internally to manager their own achievements.",
  },
  {
    question: 'How many games can I idle at once?',
    answer:
      'You can idle up to 32 games simultaneously, which is the maximum Steam allows. SGI handles these limits for you, so you can focus on other things.',
  },
  {
    question: "Can I lock achievements I've already earned?",
    answer:
      'Yes. You can lock any achievement you own, removing it from your profile. This is useful if you want to replay a game for the experience of earning those achievements again.',
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
          className='text-center mb-16 sm:mb-20'
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
        >
          <h2
            id='faq-heading'
            className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-6 leading-tight tracking-tight'
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

        <motion.div
          className='flex justify-center mt-8'
          initial={{ opacity: 0 }}
          animate={bodyInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease, delay: 0.2 }}
        >
          <Link
            prefetch={false}
            href='/docs/faq'
            className='btn-ghost px-3 py-1.5 text-xs gap-1 group'
          >
            View more FAQs
            <FiArrowUpRight className='w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150' />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
