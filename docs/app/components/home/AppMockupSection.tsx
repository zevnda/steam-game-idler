'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import Image from 'next/image'

const ease = [0.22, 1, 0.36, 1] as const

export default function AppMockupSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className='py-16 lg:py-24 overflow-hidden'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <motion.div
          ref={ref}
          className='max-w-4xl mx-auto'
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease }}
        >
          {/* Float + 3D tilt */}
          <div className='mockup-float' style={{ willChange: 'transform' }}>
            {/* Main image */}
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              <Image
                src='/examples/example.png'
                alt='Steam Game Idler Dashboard'
                width={2000}
                height={1200}
                className='w-full h-auto block'
                priority={false}
              />
            </div>

            {/* Reflection */}
            <div
              style={{
                height: '80px',
                overflow: 'hidden',
                opacity: 0.06,
                maskImage: 'linear-gradient(to bottom, black, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
                marginTop: '1px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src='/examples/example.png'
                alt=''
                aria-hidden='true'
                style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleY(-1)' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
