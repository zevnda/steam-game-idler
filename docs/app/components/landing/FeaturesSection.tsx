'use client'

import { motion } from 'framer-motion'
import { FiTrendingUp } from 'react-icons/fi'
import { TbAward, TbBuildingStore, TbCards } from 'react-icons/tb'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const features = [
  {
    icon: <TbCards className='w-6 h-6 sm:w-8 sm:h-8' />,
    title: 'Trading Card Farming',
    description:
      'Automatically farm Steam trading cards from your games with our advanced Steam card idler. Maximize card drops and sell them on the marketplace for profit.',
  },
  {
    icon: <TbAward className='w-6 h-6 sm:w-8 sm:h-8' />,
    title: 'Achievement Manager',
    description:
      'Unlock achievements automatically with human-like behavior, or manually manage achievements for any game in your library with Steam idling technology.',
  },
  {
    icon: <TbBuildingStore className='w-6 h-6 sm:w-8 sm:h-8' />,
    title: 'Trading Card Manager',
    description:
      'View and manage your entire Steam trading card inventory. Sell cards directly on the marketplace from within the Steam idler app.',
  },
  {
    icon: <FiTrendingUp className='w-6 h-6 sm:w-8 sm:h-8' />,
    title: 'Playtime Booster',
    description:
      'Increase game playtime by Steam idling games in the background. Perfect for meeting hour requirements or boosting stats with our Steam idle tool.',
  },
]

export default function FeaturesSection() {
  return (
    <motion.section
      className='relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-900 overflow-hidden'
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Background Gradients */}
      <div className='absolute inset-0 bg-gradient-to-br from-transparent via-gray-900/10 to-transparent' />
      <div className='absolute top-1/4 right-1/3 w-64 h-64 sm:w-96 sm:h-96 lg:w-[32rem] lg:h-[32rem] bg-emerald-500/8 rounded-full blur-3xl' />
      <div className='absolute bottom-1/3 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-pink-500/6 rounded-full blur-3xl' />
      <div className='absolute top-0 left-0 w-48 h-48 sm:w-80 sm:h-80 bg-blue-500/7 rounded-full blur-3xl' />
      <div className='absolute bottom-0 right-0 w-48 h-48 sm:w-72 sm:h-72 bg-amber-500/5 rounded-full blur-3xl' />

      <div className='relative z-10 max-w-6xl mx-auto'>
        <motion.div variants={itemVariants} className='text-center mb-12 sm:mb-16 lg:mb-20'>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4 sm:mb-6'>
            Powerful Steam idling features
          </h2>
          <p className='text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto px-4'>
            Everything you need to maximize your Steam library potential
          </p>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8'>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className='group p-6 sm:p-8 lg:p-12 bg-gray-900/30 rounded-2xl sm:rounded-3xl border border-gray-800 hover:border-gray-700 backdrop-blur-sm transition-[background,border] duration-300 hover:bg-gray-900/50'
            >
              <div className='flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6'>
                <div className='flex-shrink-0 p-3 sm:p-4 bg-gray-800/50 rounded-xl sm:rounded-2xl text-white group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300'>
                  <div className='w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8'>{feature.icon}</div>
                </div>
                <div className='flex-grow text-center sm:text-left'>
                  <h3 className='text-xl sm:text-2xl font-light text-white mb-3 sm:mb-4'>{feature.title}</h3>
                  <p className='text-gray-400 leading-relaxed text-base sm:text-lg'>{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
