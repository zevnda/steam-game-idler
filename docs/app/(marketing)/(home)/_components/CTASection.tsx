'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import CardBorder from '@/app/(marketing)/(home)/_components/CardBorder'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'
import { useGlobalStore } from '@/app/lib/globalStore'
import { ease } from '@/app/lib/motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export default function CTASection() {
  const { downloadSize, linuxDownloadUrl, linuxDownloadSize, selectedOS } = useGlobalStore(
    state => state,
  )
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  // Same "fall back to Windows until a real Linux release exists" rule as DownloadHero.tsx.
  const isLinux = selectedOS === 'linux' && Boolean(linuxDownloadUrl)
  const requirements = [
    { label: 'Platform', value: isLinux ? 'Linux (64-bit)' : 'Windows 10 / 11' },
    { label: 'Download size', value: (isLinux ? linuxDownloadSize : downloadSize) || '~7 MB' },
    { label: 'License', value: 'Elastic-2.0' },
  ]

  return (
    <section
      className='py-20 sm:py-24 lg:py-32 relative overflow-hidden'
      aria-labelledby='cta-heading'
    >
      <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
        <motion.div
          ref={ref}
          className='text-center max-w-4xl mx-auto'
          variants={container}
          initial='hidden'
          animate={isInView ? 'show' : 'hidden'}
        >
          <motion.h2
            id='cta-heading'
            variants={item}
            className='text-4xl sm:text-5xl md:text-6xl text-text-primary mb-6 leading-tight tracking-tight'
          >
            Ready to automate <span className='gradient-text'>your library?</span>
          </motion.h2>

          <motion.p variants={item} className='text-lg text-text-muted mb-10 leading-relaxed'>
            Download Steam Game Idler and get started within minutes. No sign-up required.
          </motion.p>

          <motion.div
            variants={item}
            className='flex flex-col sm:flex-row gap-4 justify-center mb-16'
          >
            <DownloadButton iconClassName='w-5 h-5' />
          </motion.div>

          {/* System requirements */}
          <motion.div
            variants={item}
            className='grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto'
          >
            {requirements.map(req => (
              <div
                key={req.label}
                className='relative overflow-hidden p-4 text-center'
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <CardBorder />
                <div className='text-xs text-text-muted uppercase tracking-wider mb-1'>
                  {req.label}
                </div>
                <div className='text-sm font-medium text-text-primary'>{req.value}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
