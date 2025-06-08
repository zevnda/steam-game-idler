'use client'

import { motion } from 'framer-motion'
import { FiShield } from 'react-icons/fi'

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

export default function SecuritySection() {
  return (
    <motion.section
      className='relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-900 overflow-hidden'
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Background Gradients - moved outside content container */}
      <div className='absolute top-1/3 left-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-teal-500/8 rounded-full blur-3xl transform -translate-x-1/2' />
      <div className='absolute bottom-1/4 left-1/6 w-48 h-48 sm:w-80 sm:h-80 bg-indigo-500/6 rounded-full blur-3xl' />
      <div className='absolute top-0 right-1/6 w-48 h-48 sm:w-72 sm:h-72 bg-rose-500/7 rounded-full blur-3xl' />

      <div className='relative z-10 max-w-4xl mx-auto text-center'>
        <motion.div variants={itemVariants} className='mb-8 sm:mb-12'>
          <div className='inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-900/30 rounded-2xl sm:rounded-3xl border border-gray-800 backdrop-blur-sm mb-6 sm:mb-8'>
            <FiShield className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
          </div>
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className='text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6 sm:mb-8 px-4'
        >
          Open source and secure
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className='text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12 leading-relaxed px-4'
        >
          Steam Game Idler is completely open source and built with Tauri using modern security practices. Your Steam
          credentials stay safe on your computer.
        </motion.p>

        <motion.p
          variants={itemVariants}
          className='text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12 leading-relaxed px-4'
        >
          We never collect or store any of your personal data.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className='flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4'
        >
          <div className='flex items-center space-x-3 text-gray-300'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <span className='text-sm sm:text-base'>Fully Open Source</span>
          </div>
          <div className='flex items-center space-x-3 text-gray-300'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <span className='text-sm sm:text-base'>No Data Collection</span>
          </div>
          <div className='flex items-center space-x-3 text-gray-300'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <span className='text-sm sm:text-base'>Regular Updates</span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
