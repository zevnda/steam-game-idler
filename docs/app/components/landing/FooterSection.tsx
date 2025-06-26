'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FiBook, FiFileText, FiGithub, FiMail, FiShield } from 'react-icons/fi'

export default function FooterSection() {
  return (
    <footer className='py-12 sm:py-16 md:py-20 relative'>
      {/* Top transition overlay */}
      <div className='absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-purple-600/10 to-transparent' />

      <div className='container px-4 sm:px-6 md:px-8 relative z-10'>
        {/* Main footer content */}
        <div className='grid lg:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-16'>
          {/* Brand section */}
          <div className='lg:col-span-1'>
            <div className='flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
              <Image src='/logo.png' alt='Steam Game Idler' width={28} height={28} className='sm:w-8 sm:h-8' />
              <span className='text-lg sm:text-xl font-black text-gray-800'>STEAM GAME IDLER</span>
            </div>
            <p className='text-sm sm:text-base text-gray-600 leading-relaxed mb-4 sm:mb-6'>
              The ultimate desktop application for managing your Steam gaming activities. Idle games, farm trading
              cards, unlock achievements, and optimize your Steam experience.
            </p>
            <div className='flex gap-4'>
              <a
                href='https://github.com/zevnda/steam-game-idler'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 sm:w-10 sm:h-10 bg-white border-2 border-indigo-200 flex items-center justify-center rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors duration-200 shadow-sm'
                aria-label='Visit our GitHub repository'
              >
                <FiGithub className='w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-indigo-700' />
              </a>
            </div>
          </div>

          {/* Links sections */}
          <div className='lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12'>
            <nav aria-labelledby='resources-heading'>
              <h2
                id='resources-heading'
                className='text-gray-800 font-black text-xs sm:text-sm uppercase tracking-wider mb-4 sm:mb-6'
              >
                RESOURCES
              </h2>
              <ul className='space-y-3 sm:space-y-4'>
                <li>
                  <Link
                    href='/docs'
                    className='text-sm sm:text-base text-gray-600 hover:text-indigo-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3'
                  >
                    <FiBook className='w-3 h-3 sm:w-4 sm:h-4' aria-hidden='true' />
                    Documentation
                  </Link>
                </li>
                <li>
                  <a
                    href='https://github.com/zevnda/steam-game-idler'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm sm:text-base text-gray-600 hover:text-indigo-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3'
                  >
                    <FiGithub className='w-3 h-3 sm:w-4 sm:h-4' aria-hidden='true' />
                    Source Code
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby='legal-heading'>
              <h2
                id='legal-heading'
                className='text-gray-800 font-black text-xs sm:text-sm uppercase tracking-wider mb-4 sm:mb-6'
              >
                LEGAL
              </h2>
              <ul className='space-y-3 sm:space-y-4'>
                <li>
                  <Link
                    href='/privacy'
                    className='text-sm sm:text-base text-gray-600 hover:text-indigo-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3'
                  >
                    <FiShield className='w-3 h-3 sm:w-4 sm:h-4' aria-hidden='true' />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href='/tos'
                    className='text-sm sm:text-base text-gray-600 hover:text-indigo-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3'
                  >
                    <FiFileText className='w-3 h-3 sm:w-4 sm:h-4' aria-hidden='true' />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby='contact-heading'>
              <h2
                id='contact-heading'
                className='text-gray-800 font-black text-xs sm:text-sm uppercase tracking-wider mb-4 sm:mb-6'
              >
                CONTACT
              </h2>
              <ul className='space-y-3 sm:space-y-4'>
                <li>
                  <a
                    href='mailto:contact@steamgameidler.com'
                    className='text-sm sm:text-base text-gray-600 hover:text-indigo-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3'
                  >
                    <FiMail className='w-3 h-3 sm:w-4 sm:h-4' aria-hidden='true' />
                    Email Support
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='pt-6 sm:pt-8 border-t-2 border-indigo-200 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4'>
          <div className='text-gray-600 text-xs sm:text-sm font-mono text-center sm:text-left'>
            © 2024 STEAM GAME IDLER — ALL RIGHTS RESERVED
          </div>
          <div className='text-gray-500 text-xs uppercase tracking-wider text-center sm:text-right'>
            NOT AFFILIATED WITH VALVE CORPORATION
          </div>
        </div>
      </div>
    </footer>
  )
}
