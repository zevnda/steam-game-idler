'use client'

import { TbArrowUp } from 'react-icons/tb'
import { scrollToPlayground } from './demoStore'
import Image from 'next/image'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'
import { FadeIn } from '@/app/lib/animations'
import { useGlobalStore } from '@/app/lib/globalStore'

/**
 * The closing call to action - framed in the same slowly rotating, muted rainbow rim the 3D app
 * window glows with at the top of the page, so it ends on the look it opened with.
 */
export default function FinalCta() {
  const { downloadSize, linuxDownloadUrl, linuxDownloadSize, selectedOS } = useGlobalStore(s => s)
  // Same "fall back to Windows until a real Linux release exists" rule as DownloadHero.tsx.
  const isLinux = selectedOS === 'linux' && Boolean(linuxDownloadUrl)
  const facts = [
    isLinux ? 'Linux (64-bit)' : 'Windows 10 / 11',
    (isLinux ? linuxDownloadSize : downloadSize) || '~7 MB',
    'Free to use',
  ]

  return (
    <section aria-labelledby='cta-heading' className='landing-section'>
      <div className='landing-container'>
        <FadeIn className='cta-rim max-w-5xl mx-auto'>
          <div className='cta-rim__inner px-6 py-16 sm:px-12 sm:py-24 text-center'>
            <Image
              src='/logo.png'
              alt=''
              width={56}
              height={56}
              className='relative mx-auto mb-8'
            />
            <h2
              id='cta-heading'
              className='relative text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-text-primary'
            >
              Put your library <span className='gradient-text'>to work.</span>
            </h2>
            <p className='relative mt-5 text-lg text-text-muted leading-relaxed max-w-xl mx-auto'>
              Download Steam Game Idler and get started in minutes. No sign-up required.
            </p>
            <div className='relative mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center'>
              <DownloadButton label='Download for free' iconClassName='w-5 h-5' />
              <button
                type='button'
                onClick={scrollToPlayground}
                className='btn-ghost px-6 py-3 rounded-full'
              >
                <TbArrowUp className='w-4 h-4' />
                Back to the demo
              </button>
            </div>
            <p className='relative mt-8 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-text-muted'>
              {facts.map((f, i) => (
                <span key={f} className='flex items-center gap-3'>
                  {i > 0 && (
                    <span className='w-1 h-1 rounded-full bg-white/25' aria-hidden='true' />
                  )}
                  {f}
                </span>
              ))}
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
