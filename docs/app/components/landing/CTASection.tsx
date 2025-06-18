'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaWindows } from 'react-icons/fa'

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
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

export default function CTASection() {
  return (
    <motion.section
      className='relative py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50 overflow-hidden'
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Enhanced Background Gradients */}
      <div className='absolute inset-0 bg-gradient-to-t from-gray-900/30 via-transparent to-transparent' />
      <motion.div
        className='absolute top-1/2 left-1/4 w-[800px] h-[800px] bg-gradient-to-r from-sky-500/8 to-blue-500/8 rounded-full blur-3xl transform -translate-y-1/2'
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className='absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/6 to-violet-500/6 rounded-full blur-3xl'
        animate={{
          x: [0, 80, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className='relative z-10 max-w-5xl mx-auto text-center'>
        <motion.h2
          variants={itemVariants}
          className='text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-8 sm:mb-10 px-4'
        >
          Ready to automate your{' '}
          <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
            Steam experience?
          </span>
        </motion.h2>

        <motion.div variants={itemVariants} className='flex justify-center items-center px-4 mb-8 sm:mb-10'>
          <motion.div className='flex' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href='https://github.com/zevnda/steam-game-idler/releases/latest'
              className='group relative w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-white to-gray-100 text-black text-base sm:text-lg font-semibold rounded-full transition-all duration-200 transform overflow-hidden shadow-2xl hover:shadow-white/25'
            >
              <span className='relative z-10 flex items-center justify-center transition-all duration-200 group-hover:scale-110'>
                <FaWindows className='w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3' />
                Download for Windows
              </span>
              <div className='absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className='text-gray-500 text-sm sm:text-base px-4 flex flex-wrap justify-center items-center gap-2 sm:gap-4'
        >
          <span className='flex items-center'>
            <div className='w-2 h-2 bg-emerald-500 rounded-full mr-2' />
            Always free
          </span>
          <span className='text-gray-700'>•</span>
          <span className='flex items-center'>
            <div className='w-2 h-2 bg-blue-500 rounded-full mr-2' />
            No sign-up required
          </span>
          <span className='text-gray-700'>•</span>
          <span className='flex items-center'>
            <div className='w-2 h-2 bg-purple-500 rounded-full mr-2' />
            Windows 10/11 compatible
          </span>
        </motion.div>
      </div>
    </motion.section>
  )
}
