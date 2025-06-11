'use client'

import { motion } from 'framer-motion'
import { FiEye, FiRefreshCw, FiShield } from 'react-icons/fi'
import { TbCode } from 'react-icons/tb'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const shieldVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -180 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const floatingVariants = {
  animate: {
    y: [-15, 15, -15],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const securityFeatures = [
  { icon: <TbCode className='w-5 h-5' />, label: 'Fully Open Source', color: 'from-emerald-500 to-teal-500' },
  { icon: <FiEye className='w-5 h-5' />, label: 'No Data Collection', color: 'from-blue-500 to-cyan-500' },
  { icon: <FiRefreshCw className='w-5 h-5' />, label: 'Regular Updates', color: 'from-purple-500 to-violet-500' },
]

export default function SecuritySection() {
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
        className='absolute top-1/3 left-1/2 w-[800px] h-[800px] bg-gradient-to-r from-teal-500/6 to-emerald-500/6 rounded-full blur-3xl transform -translate-x-1/2'
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className='absolute bottom-1/4 left-1/6 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/4 to-blue-500/4 rounded-full blur-3xl'
        animate={{
          x: [0, 100, 0],
          y: [0, -80, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className='relative z-10 max-w-5xl mx-auto text-center'>
        <motion.div variants={shieldVariants} className='mb-10 sm:mb-12'>
          <motion.div
            className='inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-gray-800/50 to-gray-900/80 rounded-3xl border border-gray-700/50 backdrop-blur-xl mb-8 sm:mb-10 shadow-2xl'
            variants={floatingVariants}
            animate='animate'
            whileHover={{
              scale: 1.1,
              rotate: 10,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <FiShield className='w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-emerald-400' />
          </motion.div>
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className='text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-8 sm:mb-10 px-4'
        >
          Open source and{' '}
          <span className='bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent'>secure</span>
        </motion.h2>

        <motion.div variants={itemVariants} className='max-w-4xl mx-auto mb-10 sm:mb-12'>
          <p className='text-xl sm:text-2xl text-gray-400 mb-6 sm:mb-8 leading-relaxed px-4'>
            Steam Game Idler is completely open source and built with Tauri using modern security practices. Your Steam
            credentials stay safe on your computer.
          </p>
          <p className='text-lg sm:text-xl text-gray-500 leading-relaxed px-4'>
            We will never collect or store any of your personal data.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className='flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center px-4'
        >
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.label}
              className='flex items-center space-x-4 text-gray-300 group'
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={`p-3 sm:p-4 bg-gradient-to-r ${feature.color} rounded-xl shadow-lg group-hover:shadow-xl`}
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <div className='text-white'>{feature.icon}</div>
              </motion.div>
              <span className='text-base sm:text-lg font-medium group-hover:text-white transition-colors duration-300'>
                {feature.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}
