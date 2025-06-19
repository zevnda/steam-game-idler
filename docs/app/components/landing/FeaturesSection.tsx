'use client'

import { motion } from 'framer-motion'
import { FiTrendingUp } from 'react-icons/fi'
import { TbAward, TbBuildingStore, TbCards } from 'react-icons/tb'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, rotateY: -15 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const features = [
  {
    icon: <TbCards className='w-7 h-7 sm:w-8 sm:h-8' />,
    title: 'Trading Card Farming',
    description:
      'Automatically farm Steam trading cards from your games with our advanced Steam card idler. Maximize card drops and sell them on the marketplace for profit.',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
    link: '/docs/features/card-farming',
  },
  {
    icon: <TbAward className='w-7 h-7 sm:w-8 sm:h-8' />,
    title: 'Achievement Manager',
    description:
      'Unlock achievements automatically with human-like behavior, or manually manage achievements for any game in your library with Steam idling technology.',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
    link: 'docs/features/achievement-manager',
  },
  {
    icon: <TbBuildingStore className='w-7 h-7 sm:w-8 sm:h-8' />,
    title: 'Trading Card Manager',
    description:
      'View and manage your entire Steam trading card inventory. Sell cards directly on the marketplace from within the Steam idler app.',
    gradient: 'from-purple-500 to-violet-500',
    bgGradient: 'from-purple-500/10 to-violet-500/10',
    link: '/docs/features/trading-card-manager',
  },
  {
    icon: <FiTrendingUp className='w-7 h-7 sm:w-8 sm:h-8' />,
    title: 'Playtime Booster',
    description:
      'Increase game playtime by Steam idling games in the background. Perfect for meeting hour requirements or boosting stats with our Steam idle tool.',
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-500/10 to-red-500/10',
    link: '/docs/features/playtime-booster',
  },
]

export default function FeaturesSection() {
  return (
    <motion.section
      className='relative py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50 overflow-hidden'
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Enhanced Background Gradients */}
      <motion.div
        className='absolute top-1/4 right-1/3 w-[700px] h-[700px] bg-gradient-to-r from-emerald-500/6 to-cyan-500/6 rounded-full blur-3xl'
        animate={{
          x: [0, 80, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className='absolute bottom-1/3 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/4 to-rose-500/4 rounded-full blur-3xl'
        animate={{
          x: [0, -60, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className='relative z-10 max-w-7xl mx-auto'>
        <motion.div variants={itemVariants} className='text-center mb-16 sm:mb-20 lg:mb-24'>
          <motion.h2
            className='text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6 sm:mb-8'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Powerful Steam idling{' '}
            <span className='bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent'>features</span>
          </motion.h2>
          <motion.p
            className='text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto px-4 leading-relaxed'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            Everything you need to maximize your Steam library potential
          </motion.p>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12'>
          {features.map((feature, index) => (
            <motion.a
              key={feature.title}
              href={feature.link}
              rel='noopener'
              variants={cardVariants}
              custom={index}
              className='group relative block cursor-pointer'
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 },
              }}
            >
              {/* Card background with enhanced blur */}
              <div className='absolute inset-0 bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-3xl backdrop-blur-xl border border-gray-700/40 shadow-2xl group-hover:shadow-3xl transition-all duration-500' />

              {/* Hover glow effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}
              />

              <div className='relative p-8 sm:p-10 lg:p-12'>
                <div className='flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8'>
                  <motion.div
                    className={`flex-shrink-0 p-4 sm:p-5 bg-gradient-to-br ${feature.gradient} rounded-2xl text-white shadow-lg`}
                    whileHover={{
                      scale: 1.1,
                      boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)',
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className='w-7 h-7 sm:w-8 sm:h-8'>{feature.icon}</div>
                  </motion.div>

                  <div className='flex-grow text-center sm:text-left'>
                    <motion.h3
                      className='text-2xl sm:text-3xl font-light text-white mb-4 sm:mb-5'
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                    >
                      {feature.title}
                    </motion.h3>
                    <motion.p
                      className='text-gray-400 leading-relaxed text-base sm:text-lg'
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.1 + 0.2 }}
                    >
                      {feature.description}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
