'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaWindows } from 'react-icons/fa'
import { FiDownload } from 'react-icons/fi'

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

export default function CTASection() {
  return (
    <motion.section
      className='relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-900 overflow-hidden'
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Background Gradients */}
      <div className='absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-transparent' />
      <div className='absolute top-1/2 left-1/4 w-64 h-64 sm:w-96 sm:h-96 lg:w-[28rem] lg:h-[28rem] bg-sky-500/10 rounded-full blur-3xl transform -translate-y-1/2' />
      <div className='absolute bottom-1/4 right-1/3 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/8 rounded-full blur-3xl' />
      <div className='absolute top-0 right-0 w-48 h-48 sm:w-80 sm:h-80 bg-green-500/6 rounded-full blur-3xl' />
      <div className='absolute bottom-0 left-1/6 w-48 h-48 sm:w-72 sm:h-72 bg-yellow-500/5 rounded-full blur-3xl' />
      <div className='absolute top-1/4 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-red-500/7 rounded-full blur-3xl' />

      <div className='relative z-10 max-w-4xl mx-auto text-center'>
        <motion.h2
          variants={itemVariants}
          className='text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6 sm:mb-8 px-4'
        >
          Ready to automate your Steam experience?
        </motion.h2>

        <motion.div variants={itemVariants} className='px-4'>
          <Link
            href='https://github.com/zevnda/steam-game-idler/releases/latest'
            className='download-btn inline-flex items-center justify-center w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-white text-black text-base sm:text-lg font-medium rounded-full hover:bg-gray-100 transition-all duration-300 transform relative overflow-hidden'
          >
            <span className='btn-text-original relative z-10 flex items-center'>
              <FaWindows className='w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3' />
              Download for Windows
            </span>
            <span className='btn-text-hover absolute inset-0 flex items-center justify-center'>
              <FiDownload className='w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3' />
              Get Steam Game Idler
            </span>
          </Link>
        </motion.div>

        <motion.p variants={itemVariants} className='text-gray-500 text-xs sm:text-sm mt-6 sm:mt-8 px-4'>
          Always free • No sign-up required • Windows 10/11 compatible
        </motion.p>
      </div>
    </motion.section>
  )
}
