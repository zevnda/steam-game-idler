'use client'

import type { ProPriceData } from '@/app/(marketing)/pro/_components/data'
import { FaArrowDown } from 'react-icons/fa6'

interface HeroSectionProps {
  priceData: ProPriceData
}

export default function HeroSection({ priceData }: HeroSectionProps) {
  return (
    <section className='pt-36 pb-20 sm:pt-44 sm:pb-24 relative overflow-hidden'>
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: [
            'radial-gradient(ellipse 55% 45% at 36% 40%, rgba(124,58,237,0.25) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 40% at 68% 58%, rgba(217,70,239,0.18) 0%, transparent 70%)',
            'radial-gradient(ellipse 45% 40% at 52% 30%, rgba(56,189,248,0.18) 0%, transparent 72%)',
          ].join(', '),
          filter: 'blur(6px)',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        }}
      />

      <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
        <div className='max-w-2xl mx-auto text-center'>
          <p className='text-sm font-black uppercase tracking-[0.2em] text-text-primary mb-4'>
            Steam Game Idler{' '}
            <span
              className='text-transparent bg-clip-text'
              style={{
                backgroundImage: 'linear-gradient(135deg, #b700ff 0%, #6f00ff 45%, #3583e2 100%)',
              }}
            >
              PRO
            </span>
          </p>

          <h1 className='text-5xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight uppercase mb-5 text-text-primary'>
            Unlock more features
          </h1>

          <p className='text-text-muted max-w-xl mx-auto leading-relaxed mb-8'>
            SGI&apos;s core features are <span className='font-black text-text-primary'>free</span>,
            and <span className='font-black text-text-primary'>always will be</span>. PRO exists
            purely for users who wish to support the ongoing development of SGI — the extra features
            are our way of saying <span className='font-black text-text-primary'>thank you</span>{' '}
            for your support.
          </p>

          <a
            href='#tiers'
            onClick={e => {
              e.preventDefault()
              document.getElementById('tiers')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className='inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-white text-black font-black uppercase cursor-pointer transition-transform duration-150 hover:scale-105'
          >
            View PRO Tiers
            <FaArrowDown className='w-3 h-3' />
          </a>

          <p className='text-xs text-text-muted/70 mt-4'>
            Starting at ${priceData.tierOne.price}/month &middot; Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
