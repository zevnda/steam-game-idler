'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'
import { FiArrowRight, FiClock, FiX } from 'react-icons/fi'
import { TbAward, TbSettings2, TbTerminal2 } from 'react-icons/tb'

const competitors = [
  {
    name: 'ArchiSteamFarm',
    status: 'Actively Maintained',
    statusColor: 'text-blue-600',
    description: 'Command-line tool for multi-account farming requiring complex and manual configuration',
    icon: <TbTerminal2 className='w-8 h-8' />,
    gradient: 'from-gray-500 to-gray-600',
    bgGradient: 'from-gray-50 to-slate-50',
    borderColor: 'border-gray-200 hover:border-gray-300',
    link: '/alternatives/archisteamfarm',
    pros: ['Multi-account support', 'Cross-platform'],
    cons: ['Complex setup', 'No native GUI', 'Steep learning curve'],
  },
  {
    name: 'Steam Achievement Manager',
    status: 'Community Forks Available',
    statusColor: 'text-blue-600',
    description: 'Basic achievement unlock/lock tool with community-maintained forks',
    icon: <TbAward className='w-8 h-8' />,
    gradient: 'from-gray-500 to-gray-600',
    bgGradient: 'from-gray-50 to-slate-50',
    borderColor: 'border-gray-200 hover:border-gray-300',
    link: '/alternatives/steam-achievement-manager',
    pros: ['Basic achievement management', 'Open source'],
    cons: ['Outdated original UI', 'No automation', 'No card farming'],
  },
  {
    name: 'Idle Master',
    status: 'Community Forks Available',
    statusColor: 'text-blue-600',
    description: 'Card farming tool with community-maintained forks of original project',
    icon: <FiClock className='w-8 h-8' />,
    gradient: 'from-gray-500 to-gray-600',
    bgGradient: 'from-gray-50 to-slate-50',
    borderColor: 'border-gray-200 hover:border-gray-300',
    link: '/alternatives/idle-master',
    pros: ['Basic card farming', 'Community updates'],
    cons: ['Minimal configurability', 'Limited new features', 'No achievement management'],
  },
]

export default function ComparisonSection(): ReactElement {
  return (
    <section className='py-12 sm:py-16 md:py-20 lg:py-24 relative' aria-labelledby='comparison-heading'>
      {/* Top transition border */}
      <div className='absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-rose-300 to-transparent' />

      {/* Bottom transition overlay */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-linear-to-b from-transparent to-purple-50/50' />

      <div className='container relative z-10 px-4 sm:px-6 md:px-8'>
        {/* Header */}
        <header className='max-w-4xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20'>
          <h2
            id='comparison-heading'
            className='text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 mb-6 sm:mb-8 leading-tight'
          >
            THE BEST STEAM IDLE TOOL{' '}
            <span className='block text-transparent bg-clip-text bg-linear-to-r from-[#8400ff] to-[#ff0066]'>
              VS THE COMPETITION
            </span>
          </h2>
          <p className='text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed'>
            Steam Game Idler stands out from other Steam idlers and card farmers with modern features, active
            development, and user-friendly design. See how our Steam idle tool compares to ArchiSteamFarm, Steam
            Achievement Manager, and Idle Master.
          </p>
        </header>

        {/* Steam Game Idler Card - Featured */}
        <article className='max-w-4xl mx-auto mb-12 sm:mb-16'>
          <div className='bg-white border-2 border-purple-200 rounded-3xl p-6 sm:p-8 shadow-xl ring-2 ring-purple-300/30'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6'>
              <div
                className='w-16 h-16 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0'
                aria-hidden='true'
              >
                <TbSettings2 className='w-8 h-8 text-white' />
              </div>
              <div className='flex-1'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2'>
                  <h3 className='text-2xl sm:text-3xl font-bold text-gray-800'>Steam Game Idler</h3>
                  <div className='text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full w-fit'>
                    #1 STEAM IDLER & CARD FARMER
                  </div>
                </div>
                <p className='text-gray-700 text-sm sm:text-base leading-relaxed'>
                  The best Steam idle tool and card farmer available. A modern alternative to ArchiSteamFarm, Steam
                  Achievement Manager, and Idle Master. Offering Steam card farming, achievement management, and
                  playtime boosting in an all-in-one solution.
                </p>
              </div>
            </div>

            <div className='grid sm:grid-cols-2 gap-6'>
              <div>
                <h4 className='text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider'>
                  Why We&apos;re The Best Steam Idler
                </h4>
                <ul className='space-y-2'>
                  <li className='flex items-center gap-3 text-sm text-gray-700'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' aria-hidden='true' />
                    Most user-friendly Steam idle interface
                  </li>
                  <li className='flex items-center gap-3 text-sm text-gray-700'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' aria-hidden='true' />
                    Fastest Steam card farmer setup
                  </li>
                  <li className='flex items-center gap-3 text-sm text-gray-700'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' aria-hidden='true' />
                    Most comprehensive Steam idling features
                  </li>
                  <li className='flex items-center gap-3 text-sm text-gray-700'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' aria-hidden='true' />
                    Active development & Steam idler community
                  </li>
                </ul>
              </div>
              <div>
                <h4 className='text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider'>
                  Perfect For Steam Idlers Who Want
                </h4>
                <p className='text-sm text-gray-700 leading-relaxed'>
                  Individual Steam users who want the best Steam idle tool with modern design, active development, and
                  comprehensive Steam card farming features without the complexity of ArchiSteamFarm.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Competitor Cards */}
        <div className='grid lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto'>
          {competitors.map((competitor, index) => (
            <article key={competitor.name}>
              <Link
                prefetch={false}
                href={competitor.link}
                className={`group block bg-white border-2 ${competitor.borderColor} rounded-2xl p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
              >
                {/* Content */}
                <div className='relative z-10'>
                  {/* Header */}
                  <div className='flex items-start justify-between mb-4'>
                    <div
                      className={`p-3 rounded-xl bg-linear-to-r ${competitor.gradient} text-white`}
                      aria-hidden='true'
                    >
                      {competitor.icon}
                    </div>
                    <FiArrowRight
                      className='w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200'
                      aria-hidden='true'
                    />
                  </div>

                  {/* Title and Status */}
                  <div className='mb-3'>
                    <h3 className='text-xl font-bold text-gray-800 mb-1'>{competitor.name}</h3>
                    <div className={`text-xs font-semibold ${competitor.statusColor} uppercase tracking-wider`}>
                      {competitor.status}
                    </div>
                  </div>

                  {/* Description */}
                  <p className='text-gray-600 text-sm leading-relaxed mb-6'>{competitor.description}</p>

                  {/* Pros and Cons */}
                  <div className='space-y-4'>
                    <div>
                      <h4 className='text-xs font-bold text-gray-800 mb-2 uppercase tracking-wider'>Pros</h4>
                      <ul className='space-y-1'>
                        {competitor.pros.map(item => (
                          <li key={item} className='flex items-center gap-2 text-xs text-gray-600'>
                            <div className='w-1.5 h-1.5 bg-green-500 rounded-full' aria-hidden='true' />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className='text-xs font-bold text-gray-800 mb-2 uppercase tracking-wider'>Cons</h4>
                      <ul className='space-y-1'>
                        {competitor.cons.map(item => (
                          <li key={item} className='flex items-center gap-2 text-xs text-gray-600'>
                            <FiX className='w-3 h-3 text-red-500 shrink-0' aria-hidden='true' />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* View Comparison CTA */}
                  <div className='mt-6 pt-4 border-t border-gray-200'>
                    <div className='text-xs font-semibold text-gray-500 group-hover:text-gray-700 transition-colors duration-200 uppercase tracking-wider'>
                      View Detailed Comparison →
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
