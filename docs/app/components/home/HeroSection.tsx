'use client'

import type { ReactElement } from 'react'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight, FaStar, FaWindows } from 'react-icons/fa'
import { FaDiscord } from 'react-icons/fa6'
import { FiBook, FiGithub } from 'react-icons/fi'

export default function HeroSection(): ReactElement {
  const [latestVersion, setLatestVersion] = useState('1.2.3')
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    try {
      fetch('https://api.github.com/repos/zevnda/steam-game-idler/releases/latest')
        .then(response => response.json())
        .then(data => {
          if (data.tag_name) {
            setLatestVersion(data.tag_name)
          }
        })
    } catch (error) {
      console.error('Error fetching latest version:', error)
    }
  }, [])

  useEffect(() => {
    try {
      fetch('https://api.github.com/repos/zevnda/steam-game-idler')
        .then(response => response.json())
        .then(data => {
          if (typeof data.stargazers_count === 'number') {
            setStars(data.stargazers_count)
          }
        })
    } catch (error) {
      console.error('Error fetching GitHub stars:', error)
    }
  }, [])

  return (
    <section className='min-h-screen flex items-center relative overflow-hidden bg-linear-to-b from-white via-gray-50 to-white'>
      {/* Subtle background pattern */}
      <div
        className='absolute inset-0 opacity-[0.4]'
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(139 69 193) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Gradient overlay for smooth transition */}
      <div className='absolute inset-0 bg-linear-to-b from-white via-transparent to-white' />

      <div className='absolute inset-0 pointer-events-none z-20'>
        {/* Top left area */}
        <div
          className='absolute hidden xl:block top-14 left-4 md:left-12 lg:left-16 transform -rotate-12 animate-float'
          style={{ animationDelay: '0.1s' }}
        >
          <div className='relative p-px bg-linear-to-r from-purple-400 via-pink-400 to-yellow-400 rounded-xl'>
            <div className='bg-white/95 rounded-xl px-4 py-3 shadow-xl max-w-xs'>
              <div className='flex items-start space-x-3'>
                <div className='flex text-yellow-400 text-sm'>★★★★★</div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-700 font-medium'>&quot;Farmed 500+ cards in just 2 days!&quot;</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top right area */}
        <div
          className='absolute hidden xl:block top-12 right-4 md:right-12 lg:right-20 transform rotate-6 animate-float'
          style={{ animationDelay: '0.5s' }}
        >
          <div className='relative p-px bg-linear-to-r from-green-400 via-blue-400 to-purple-400 rounded-xl'>
            <div className='bg-white/95 rounded-xl px-4 py-3 shadow-xl max-w-xs'>
              <div className='flex items-start space-x-3'>
                <div className='flex text-yellow-400 text-sm'>★★★★★</div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-700 font-medium'>
                    &quot;Best idler I&apos;ve ever used. So simple!&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom left area */}
        <div
          className='absolute hidden xl:block bottom-16 left-6 md:left-16 lg:left-24 transform rotate-6 animate-float'
          style={{ animationDelay: '0.6s' }}
        >
          <div className='relative p-px bg-linear-to-r from-pink-400 via-rose-400 to-orange-400 rounded-xl'>
            <div className='bg-white/95 rounded-xl px-4 py-3 shadow-xl max-w-xs'>
              <div className='flex items-start space-x-3'>
                <div className='flex text-yellow-400 text-sm'>★★★★★</div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-700 font-medium'>
                    &quot;Open source and completely safe to use&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom right area */}
        <div
          className='absolute hidden xl:block bottom-20 right-6 md:right-16 lg:right-28 transform -rotate-12 animate-float'
          style={{ animationDelay: '1.0s' }}
        >
          <div className='relative p-px bg-linear-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-xl'>
            <div className='bg-white/95 rounded-xl px-4 py-3 shadow-xl max-w-xs'>
              <div className='flex items-start space-x-3'>
                <div className='flex text-yellow-400 text-sm'>★★★★★</div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-700 font-medium'>&quot;Earned $50+ selling cards this month&quot;</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className='hidden xl:block absolute top-20 left-1/3 transform rotate-3 animate-float'
          style={{ animationDelay: '1s' }}
        >
          <div className='relative p-px bg-linear-to-r from-indigo-400 via-purple-400 to-blue-400 rounded-xl'>
            <div className='bg-white/95 rounded-xl px-4 py-3 shadow-xl max-w-xs'>
              <div className='flex items-start space-x-3'>
                <div className='flex text-yellow-400 text-sm'>★★★★★</div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-700 font-medium'>
                    &quot;Works perfectly with all my Steam games&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className='hidden xl:block absolute bottom-20 left-1/2 transform -translate-x-1/2 -rotate-3 animate-float'
          style={{ animationDelay: '1.0s' }}
        >
          <div className='relative p-px bg-linear-to-r from-rose-400 via-pink-400 to-purple-400 rounded-xl'>
            <div className='bg-white/95 rounded-xl px-4 py-3 shadow-xl max-w-xs'>
              <div className='flex items-start space-x-3'>
                <div className='flex text-yellow-400 text-sm'>★★★★★</div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-700 font-medium'>
                    &quot;Set it and forget it - works like magic!&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='container relative z-10 px-4 md:px-6 lg:px-8'>
        <div className='grid lg:grid-cols-2 gap-6 lg:gap-12 items-center min-h-screen py-12 sm:py-16 md:py-20'>
          {/* Left column - Text content */}
          <div className='space-y-4 sm:space-y-6 md:space-y-8 text-center lg:text-left'>
            {/* Badges */}
            <div className='flex flex-wrap gap-2 justify-center lg:justify-start'>
              <div className='inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-linear-to-r from-green-200 to-blue-200 border border-green-300 rounded-full text-green-800 text-xs sm:text-sm font-medium shadow-lg'>
                <span className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-2 animate-pulse' />v
                {latestVersion} Available
              </div>

              <Link href='https://github.com/zevnda/steam-game-idler'>
                <div className='inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-linear-to-r from-yellow-100 to-yellow-300 border border-yellow-300 rounded-full text-yellow-800 text-xs sm:text-sm font-medium shadow-lg'>
                  <FaStar className='text-yellow-500 mr-1' />
                  Star on GitHub{' '}
                  <span className='bg-yellow-400 font-semibold rounded-full px-1.5 ml-1 '>
                    {stars !== null ? stars.toLocaleString() : '...'}
                  </span>
                </div>
              </Link>
            </div>

            {/* Main heading */}
            <div className='space-y-2 sm:space-y-3 md:space-y-4'>
              <h1 className='text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-none'>
                <span className='block text-gray-800'>STEAM</span>{' '}
                <span className='text-transparent bg-clip-text bg-linear-to-r from-purple-500 via-pink-500 to-orange-500'>
                  GAME IDLER
                </span>
              </h1>
              <div className='w-40 sm:w-56 md:w-72 lg:w-80 xl:w-[24rem] h-1 bg-linear-to-r from-purple-500 to-pink-500 rounded-full mx-auto lg:mx-0' />
            </div>

            {/* Subtitle */}
            <h2 className='text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-lg leading-relaxed mx-auto lg:mx-0 px-4 sm:px-0'>
              The most advanced Steam idle tool for farming trading cards, managing achievements, and boosting playtime.
              Join thousands of Steam idlers using our card farmer.
            </h2>

            {/* GitHub link */}
            <div className='flex justify-center lg:justify-start px-4 sm:px-0'>
              <Link
                prefetch={false}
                href='https://github.com/zevnda/steam-game-idler'
                target='_blank'
                rel='noopener noreferrer'
                className='group inline-flex items-center text-gray-600 hover:text-purple-600 transition-colors duration-200 text-sm'
              >
                <FiGithub className='w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200' />
                View the best Steam idler on GitHub
                <FaArrowRight className='w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-200' />
              </Link>
            </div>

            {/* Action buttons */}
            <div className='flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start px-4 sm:px-0'>
              <Link
                prefetch={false}
                href='https://github.com/zevnda/steam-game-idler/releases/latest'
                className='group inline-flex items-center justify-center px-6 sm:px-6 md:px-8 py-3 sm:py-3 md:py-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm md:text-base'
              >
                <FaWindows className='w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3' />
                DOWNLOAD
                <FaArrowRight className='w-3 h-3 md:w-4 md:h-4 ml-2 md:ml-3 group-hover:translate-x-1 transition-transform duration-200' />
              </Link>

              <Link
                prefetch={false}
                href='/docs'
                className='inline-flex items-center justify-center px-6 sm:px-6 md:px-8 py-3 sm:py-3 md:py-4 bg-white border-2 border-purple-300 text-purple-700 font-bold rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-colors duration-200 shadow-md text-sm md:text-base'
              >
                <FiBook className='w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3' />
                DOCUMENTATION
              </Link>

              <Link
                prefetch={false}
                href='https://discord.com/invite/5kY2ZbVnZ8'
                target='_blank'
                className='inline-flex items-center justify-center px-3 sm:px-3 md:px-4 py-3 sm:py-3 md:py-4 bg-white border-2 border-purple-300 text-purple-700 font-bold rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-colors duration-200 shadow-md text-sm md:text-base'
              >
                <FaDiscord className='w-4 h-4 md:w-5 md:h-5 mr-2 sm:mr-0' />
                <span className='block sm:hidden'>JOIN OUR DISCORD</span>
              </Link>
            </div>

            {/* Quick stats */}
            <div className='flex items-center justify-center lg:justify-start gap-3 sm:gap-4 md:gap-6 lg:gap-8 pt-4 sm:pt-6 md:pt-8 px-4 sm:px-0'>
              <div className='text-center'>
                <div
                  className='text-lg sm:text-xl md:text-2xl font-bold text-purple-600'
                  aria-label='16 thousand plus Steam idlers'
                >
                  40K+
                </div>
                <div className='text-xs text-gray-600 uppercase tracking-wider'>USERS</div>
              </div>
              <div className='w-px h-5 sm:h-6 md:h-8 bg-purple-300' />
              <div className='text-center'>
                <div
                  className='text-lg sm:text-xl md:text-2xl font-bold text-pink-600'
                  aria-label='42 languages supported'
                >
                  30
                </div>
                <div className='text-xs text-gray-600 uppercase tracking-wider'>LANGUAGES</div>
              </div>
              <div className='w-px h-5 sm:h-6 md:h-8 bg-purple-300' />
              <div className='text-center'>
                <div
                  className='text-lg sm:text-xl md:text-2xl font-bold text-orange-600'
                  aria-label='100 percent open source'
                >
                  100%
                </div>
                <div className='text-xs text-gray-600 uppercase tracking-wider'>OPEN SOURCE</div>
              </div>
            </div>
          </div>

          {/* Right column - Visual element */}
          <div className='relative hidden lg:block overflow-hidden lg:overflow-visible mt-6 sm:mt-8 lg:mt-0 px-4 sm:px-0'>
            {/* Floating decorative elements */}
            <div className='absolute inset-0 pointer-events-none'>
              {/* Gradient orbs */}
              <div className='absolute top-10 left-4 w-32 h-32 bg-linear-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse' />
              <div className='absolute bottom-20 right-8 w-24 h-24 bg-linear-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-lg animate-pulse delay-1000' />
              <div className='absolute top-32 right-12 w-16 h-16 bg-linear-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-md animate-pulse delay-500' />

              {/* Floating geometric shapes */}
              <div className='absolute top-8 right-4 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-300' />
              <div className='absolute bottom-32 left-8 w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-700' />
              <div className='absolute top-40 left-12 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-1000' />
            </div>

            <div className='relative'>
              {/* Background glow effect */}
              <div className='absolute inset-0 bg-linear-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-3xl blur-3xl transform scale-110' />

              {/* Main image container */}
              <div className='relative transform lg:-mr-64 xl:-mr-96 2xl:-mr-128'>
                {/* Image backdrop with gradient */}
                <div className='absolute inset-0 bg-linear-to-br from-white via-purple-50/50 to-pink-50/50 rounded-xl sm:rounded-2xl md:rounded-3xl' />

                {/* Image with enhanced shadows and effects */}
                <div className='relative'>
                  <Image
                    src='/examples/example.png'
                    alt='Steam Game Idler Dashboard Screenshot'
                    width={2000}
                    height={1200}
                    className='w-full sm:w-full md:w-[120%] lg:w-[200%] xl:w-[250%] 2xl:w-[300%] h-auto object-cover rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl ring-1 ring-white/20'
                    priority
                  />

                  {/* Subtle overlay gradient on image */}
                  <div className='absolute inset-0 bg-linear-to-t from-purple-900/5 via-transparent to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl' />
                </div>

                {/* Bottom reflection effect */}
                <div className='absolute -bottom-2 left-0 right-0 h-8 bg-linear-to-t from-purple-100/20 to-transparent rounded-b-3xl blur-sm' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
