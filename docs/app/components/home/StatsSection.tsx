'use client'

import type { ReactElement } from 'react'

import { useEffect, useState } from 'react'
import { FiDownload, FiGlobe, FiStar } from 'react-icons/fi'
import { TbCode } from 'react-icons/tb'

export default function StatsSection(): ReactElement {
  const [githubStars, setGithubStars] = useState(999)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadGitHubStars = async (): Promise<void> => {
      try {
        const response = await fetch('https://api.github.com/repos/zevnda/steam-game-idler')
        const data = await response.json()
        setGithubStars(data.stargazers_count || 999)
      } catch (error) {
        setGithubStars(999)
        console.error('Failed to fetch GitHub stars:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadGitHubStars()
  }, [])

  const stats = [
    {
      value: '16K+',
      label: 'Downloads',
      icon: <FiDownload className='w-6 h-6' />,
      description: 'Active installations worldwide',
    },
    {
      value: '42',
      label: 'Languages',
      icon: <FiGlobe className='w-6 h-6' />,
      description: 'Localization support',
    },
    {
      value: isLoading ? '...' : githubStars.toString(),
      label: 'GitHub Stars',
      icon: <FiStar className='w-6 h-6' />,
      description: 'Community recognition',
    },
    {
      value: '100%',
      label: 'Open Source',
      icon: <TbCode className='w-6 h-6' />,
      description: 'Transparent development',
    },
  ]

  return (
    <section className='py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden' aria-labelledby='stats-heading'>
      {/* Top transition border */}
      <div className='absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-300 to-transparent' />

      {/* Bottom transition overlay */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-linear-to-b from-transparent to-purple-100/50' />

      <div className='container relative z-10 px-4 sm:px-6 md:px-8'>
        {/* Header with side-by-side layout */}
        <header className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center mb-12 sm:mb-16 lg:mb-20'>
          <div>
            <h2
              id='stats-heading'
              className='text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 mb-4 sm:mb-6 leading-tight'
            >
              THE #1 STEAM IDLE{' '}
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-orange-500'>
                TOOL WORLDWIDE
              </span>
            </h2>
          </div>
          <div>
            <p className='text-base sm:text-lg text-gray-700 leading-relaxed'>
              Steam Game Idler is the go-to choice for users looking to automate their Steam experience. Our Steam card
              farmer is trusted by thousands of users worldwide, with support for 42 languages.
            </p>
          </div>
        </header>

        {/* Stats in horizontal cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
          {stats.map((stat, index) => (
            <article key={stat.label} className='group'>
              <div className='bg-white border-2 border-indigo-200 p-6 sm:p-8 hover:border-indigo-400 hover:bg-white/90 transition-all duration-200 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2'>
                <div className='flex items-start justify-between mb-4 sm:mb-6'>
                  <div
                    className='text-indigo-500 group-hover:text-purple-500 transition-colors duration-200'
                    aria-hidden='true'
                  >
                    {stat.icon}
                  </div>
                  <div className='text-right'>
                    <div
                      className='text-2xl sm:text-3xl font-black text-gray-800 mb-1'
                      aria-label={`${stat.value} ${stat.label}`}
                    >
                      {stat.value}
                    </div>
                    <div className='text-xs text-indigo-600 uppercase tracking-widest font-bold'>{stat.label}</div>
                  </div>
                </div>
                <p className='text-sm text-gray-600 leading-relaxed'>{stat.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
