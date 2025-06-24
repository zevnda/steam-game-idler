'use client'

import Link from 'next/link'
import { FiArrowUpRight, FiTrendingUp } from 'react-icons/fi'
import { TbAward, TbBuildingStore, TbCards } from 'react-icons/tb'

const features = [
  {
    icon: <TbCards className='w-8 h-8' />,
    title: 'Trading Card Farming',
    description:
      'Automatically farm Steam trading cards from your games with our advanced card idler. A more user-friendly alternative to ArchiSteamFarm, maximizing card drops for marketplace profit.',
    link: '/docs/features/card-farming',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200 hover:border-blue-300',
  },
  {
    icon: <TbAward className='w-8 h-8' />,
    title: 'Achievement Manager',
    description:
      'Unlock achievements automatically with human-like behavior, or manually manage achievements for any game. A streamlined alternative to Steam Achievement Manager with enhanced safety features.',
    link: '/docs/features/achievement-manager',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200 hover:border-purple-300',
  },
  {
    icon: <TbBuildingStore className='w-8 h-8' />,
    title: 'Trading Card Manager',
    description:
      'View and manage your entire Steam trading card inventory. Sell cards directly on the marketplace from within the app, offering better integration than traditional Steam idling tools.',
    link: '/docs/features/trading-card-manager',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200 hover:border-emerald-300',
  },
  {
    icon: <FiTrendingUp className='w-8 h-8' />,
    title: 'Playtime Booster',
    description:
      'Increase game playtime by idling games in the background. A modern evolution of Idle Master with improved efficiency and Steam detection avoidance for meeting hour requirements.',
    link: '/docs/features/playtime-booster',
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200 hover:border-orange-300',
  },
]

export default function FeaturesSection() {
  return (
    <section className='py-12 sm:py-16 md:py-20 lg:py-24 relative'>
      {/* Top transition border */}
      <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent' />

      {/* Bottom transition overlay */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-emerald-50/50' />

      <div className='container relative z-10 px-4 sm:px-6 md:px-8'>
        {/* Header */}
        <div className='max-w-3xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20'>
          <h2 className='text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 mb-6 sm:mb-8 leading-tight'>
            POWERFUL AUTOMATION
            <span className='block text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-fuchsia-500'>
              FEATURES
            </span>
          </h2>
          <p className='text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed'>
            Our advanced automation tools are designed to enhance your Steam gaming experience, from farming trading
            cards to managing achievements and boosting playtime.
          </p>
        </div>

        {/* Features grid */}
        <div className='grid md:grid-cols-2 gap-8 max-w-6xl mx-auto'>
          {features.map((feature, index) => (
            <Link
              key={feature.title}
              href={feature.link}
              className={`group block relative overflow-hidden bg-white border-2 ${feature.borderColor} rounded-3xl p-8 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:scale-[1.01]`}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-50 transition-opacity duration-200`}
              />

              {/* Content */}
              <div className='relative z-10'>
                {/* Icon and arrow */}
                <div className='flex items-start justify-between mb-6'>
                  <div
                    className={`relative p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-200`}
                  >
                    {feature.icon}
                  </div>
                  <FiArrowUpRight className='w-6 h-6 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200' />
                </div>

                {/* Title */}
                <h3 className='text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-200'>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className='text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-200 pb-4'>
                  {feature.description}
                </p>

                {/* Hover decoration */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-b-3xl`}
                />
              </div>

              {/* Corner decoration */}
              <div
                className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-10 transform rotate-45 translate-x-10 -translate-y-10 group-hover:translate-x-10 group-hover:-translate-y-10 transition-transform duration-200`}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
