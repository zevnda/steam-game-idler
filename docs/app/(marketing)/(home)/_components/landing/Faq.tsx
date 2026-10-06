'use client'

import { useState } from 'react'
import { FaDiscord } from 'react-icons/fa6'
import { FiArrowUpRight } from 'react-icons/fi'
import { TbPlus } from 'react-icons/tb'
import { FAQ } from './faqData'
import SectionHeading from './SectionHeading'
import Link from 'next/link'
import { FadeIn } from '@/app/lib/animations'

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section aria-labelledby='faq-heading' className='landing-section'>
      <div className='landing-container grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 lg:gap-20'>
        <div className='lg:sticky lg:top-28 lg:self-start'>
          <SectionHeading
            id='faq-heading'
            align='left'
            eyebrow='FAQ'
            title={
              <>
                Questions, <span className='gradient-text'>answered.</span>
              </>
            }
            sub='The things people ask most before downloading.'
          />
          <FadeIn className='mt-8 flex flex-wrap gap-3' delay={0.1}>
            <Link prefetch={false} href='/docs/faq' className='btn-ghost px-5 py-2.5 rounded-full'>
              All FAQs <FiArrowUpRight className='w-4 h-4' />
            </Link>
            <Link
              prefetch={false}
              href='https://discord.com/invite/5kY2ZbVnZ8'
              target='_blank'
              className='btn-ghost px-5 py-2.5 rounded-full'
            >
              <FaDiscord className='w-4 h-4' /> Ask on Discord
            </Link>
          </FadeIn>
        </div>

        <FadeIn className='flex flex-col gap-3'>
          {FAQ.map(({ question, answer }, i) => {
            const isOpen = open === i
            return (
              <div key={question} className={`faq-card ${isOpen ? 'faq-card--open' : ''}`}>
                <h3>
                  <button
                    type='button'
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className='faq-card__trigger'
                  >
                    <span className='flex-1 text-base sm:text-[17px] font-medium text-text-primary'>
                      {question}
                    </span>
                    <span className='faq-card__toggle' aria-hidden='true'>
                      <TbPlus className='w-4 h-4' />
                    </span>
                  </button>
                </h3>
                <div id={`faq-${i}`} role='region' className='faq-card__body'>
                  <div className='overflow-hidden'>
                    <p className='faq-card__answer'>{answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </FadeIn>
      </div>
    </section>
  )
}
