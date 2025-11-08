'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa'
import { FiDownload } from 'react-icons/fi'

export default function CTASection(): ReactElement {
  return (
    <section className='py-16 sm:py-20 md:py-24 lg:py-32 relative overflow-hidden' aria-labelledby='cta-heading'>
      {/* Transition from previous section */}
      <div className='absolute top-0 left-0 right-0 h-16 bg-linear-to-b from-purple-100/50 to-transparent' />

      {/* Strong overlay for CTA distinction */}
      <div className='absolute inset-0 bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600' />
      <div className='absolute inset-0 bg-grid-white/[0.08] bg-grid-pattern' />

      {/* Bottom transition to footer */}
      <div className='absolute bottom-0 left-0 right-0 h-16 bg-linear-to-b from-transparent to-gray-100/20' />

      <div className='container relative z-10 px-4 sm:px-6 md:px-8'>
        <div className='text-center max-w-4xl mx-auto'>
          <h2
            id='cta-heading'
            className='text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white mb-6 sm:mb-8 leading-none'
          >
            START USING THE
            <span className='block text-transparent bg-clip-text bg-linear-to-r from-cyan-200 via-white to-blue-200'>
              BEST STEAM IDLER
            </span>
          </h2>

          <p className='text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0'>
            Download the ultimate Steam idle tool and card farmer today. Join thousands of users automating their Steam
            experience. No registration, no subscriptions, completely free.
          </p>

          {/* Action buttons */}
          <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4 sm:px-0'>
            <Link
              prefetch={false}
              href='https://github.com/zevnda/steam-game-idler/releases/latest'
              className='group inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-white text-indigo-700 font-black text-base sm:text-lg rounded-xl hover:bg-cyan-100 transform hover:scale-105 transition-all duration-200 shadow-2xl'
            >
              <FiDownload className='w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4' />
              <span className='hidden sm:inline'>GET THE BEST STEAM IDLER</span>
              <span className='sm:hidden'>DOWNLOAD STEAM IDLER</span>
              <FaArrowRight className='w-4 h-4 sm:w-5 sm:h-5 ml-3 sm:ml-4 group-hover:translate-x-2 transition-transform duration-200' />
            </Link>
          </div>

          {/* System requirements */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto text-white/90 px-4 sm:px-0'>
            <div className='text-center bg-white/10 rounded-xl p-3 sm:p-4'>
              <h3 className='text-base sm:text-lg font-bold mb-1 sm:mb-2'>SYSTEM</h3>
              <div className='text-xs sm:text-sm opacity-90'>Windows 10/11</div>
            </div>
            <div className='text-center bg-white/10 rounded-xl p-3 sm:p-4'>
              <h3 className='text-base sm:text-lg font-bold mb-1 sm:mb-2'>SIZE</h3>
              <div className='text-xs sm:text-sm opacity-90'>~6MB Download</div>
            </div>
            <div className='text-center bg-white/10 rounded-xl p-3 sm:p-4'>
              <h3 className='text-base sm:text-lg font-bold mb-1 sm:mb-2'>MIT LICENSE</h3>
              <div className='text-xs sm:text-sm opacity-90'>100% Free & Open</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
