'use client'

import type { ReactElement } from 'react'

import { FiCode, FiEye, FiRefreshCw } from 'react-icons/fi'
import { TbBrandGithub } from 'react-icons/tb'

export default function SecuritySection(): ReactElement {
  return (
    <section className='py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden' aria-labelledby='security-heading'>
      {/* Top transition border */}
      <div className='absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-300 to-transparent' />

      {/* Bottom transition overlay */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-linear-to-b from-transparent to-blue-50/50' />

      <div className='container relative z-10 px-4 sm:px-6 md:px-8'>
        <div className='grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center'>
          {/* Left side - Content */}
          <div>
            <h2
              id='security-heading'
              className='text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 mb-6 sm:mb-8 leading-tight'
            >
              BUILT WITH{' '}
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-lime-500'>
                TRANSPARENCY
              </span>
            </h2>

            <p className='text-base sm:text-lg md:text-xl text-gray-700 mb-8 sm:mb-12 leading-relaxed'>
              Every line of code is open for inspection. No hidden telemetry, no data collection, no backdoors. Your
              Steam credentials never leave your machine.
            </p>

            <div className='space-y-4 sm:space-y-6'>
              <div className='flex items-start gap-3 sm:gap-4'>
                <div
                  className='bg-linear-to-r from-emerald-200 to-emerald-300 p-2 sm:p-3 rounded-xl border border-emerald-300 shrink-0'
                  aria-hidden='true'
                >
                  <TbBrandGithub className='w-5 h-5 sm:w-6 sm:h-6 text-emerald-700' />
                </div>
                <div>
                  <h3 className='text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2'>Open Source Repository</h3>
                  <p className='text-sm sm:text-base text-gray-600'>
                    Complete source code available on GitHub with full commit history.
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 sm:gap-4'>
                <div
                  className='bg-linear-to-r from-purple-200 to-purple-300 p-2 sm:p-3 rounded-xl border border-purple-300 shrink-0'
                  aria-hidden='true'
                >
                  <FiEye className='w-5 h-5 sm:w-6 sm:h-6 text-purple-700' />
                </div>
                <div>
                  <h3 className='text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2'>Zero Data Collection</h3>
                  <p className='text-sm sm:text-base text-gray-600'>
                    No analytics, tracking, or personal data harvesting of any kind.
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 sm:gap-4'>
                <div
                  className='bg-linear-to-r from-rose-200 to-rose-300 p-2 sm:p-3 rounded-xl border border-rose-300 shrink-0'
                  aria-hidden='true'
                >
                  <FiRefreshCw className='w-5 h-5 sm:w-6 sm:h-6 text-rose-700' />
                </div>
                <div>
                  <h3 className='text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2'>Continuous Updates</h3>
                  <p className='text-sm sm:text-base text-gray-600'>
                    Regular security patches and feature improvements from the community.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Visual */}
          <div className='relative mt-8 lg:mt-0'>
            <div className='bg-white border-2 border-emerald-200 rounded-2xl p-4 sm:p-6 shadow-xl'>
              <div className='flex items-center gap-2 mb-4 sm:mb-6'>
                <FiCode className='w-4 h-4 sm:w-5 sm:h-5 text-emerald-600' />
                <span className='text-emerald-700 font-mono text-xs sm:text-sm'>security-audit.log</span>
              </div>

              <div className='space-y-2 sm:space-y-3 font-mono text-xs sm:text-sm'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <span className='text-emerald-600'>✓</span>
                  <span className='text-gray-700'>No suspicious network calls detected</span>
                </div>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <span className='text-emerald-600'>✓</span>
                  <span className='text-gray-700'>Zero telemetry endpoints found</span>
                </div>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <span className='text-emerald-600'>✓</span>
                  <span className='text-gray-700'>Credentials stored locally only</span>
                </div>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <span className='text-emerald-600'>✓</span>
                  <span className='text-gray-700'>Open source verification passed</span>
                </div>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <span className='text-emerald-600'>✓</span>
                  <span className='text-gray-700'>Code security validated</span>
                </div>
              </div>

              <div className='mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-emerald-200'>
                <div className='text-emerald-700 font-mono text-xs font-bold'>SECURITY SCORE: A+</div>
              </div>
            </div>

            {/* Floating security badge */}
            <div className='absolute -top-2 sm:-top-4 -right-2 sm:-right-4 bg-linear-to-r from-emerald-400 to-teal-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm shadow-lg'>
              VERIFIED SECURE
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
