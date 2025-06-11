'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { FaWindows } from 'react-icons/fa'
import { FiDownload, FiGithub, FiZap } from 'react-icons/fi'
import { MdOutlineVerified } from 'react-icons/md'

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

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const trustBadges = [
  { icon: <FiGithub className='w-5 h-5 sm:w-8 sm:h-8' />, label: 'Open Source', description: 'Fully transparent code' },
  {
    icon: <MdOutlineVerified className='w-5 h-5 sm:w-8 sm:h-8' />,
    label: 'Trusted App',
    description: '15K+ downloads',
  },
  { icon: <FiZap className='w-5 h-5 sm:w-8 sm:h-8' />, label: 'No Setup', description: 'Just install and use' },
]

export default function HeroSection() {
  return (
    <motion.section
      className='relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <div className='absolute inset-0 bg-gradient-to-b from-black via-gray-900/20 to-black' />

      <div className='relative z-10 max-w-6xl mx-auto text-center'>
        <motion.div variants={itemVariants} className='mb-6 sm:mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-900/30 rounded-2xl sm:rounded-3xl border border-gray-800 backdrop-blur-sm mb-6 sm:mb-8'>
            <Image
              src='/logo.png'
              alt='Logo'
              width={48}
              height={48}
              className='w-10 h-10 sm:w-16 sm:h-16 lg:w-16 lg:h-16'
            />
          </div>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className='text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight mb-4 sm:mb-6 leading-none px-2 bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent'
        >
          Steam Game Idler
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className='max-w-2xl mx-auto text-lg sm:text-xl lg:text-2xl font-light text-gray-300 mb-8 sm:mb-12 leading-relaxed px-4'
        >
          A powerful Steam idler for farming trading cards, managing achievements, and boosting playtime. The most
          advanced Steam card idler available.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className='flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4'
        >
          <Link
            href='https://github.com/zevnda/steam-game-idler/releases/latest'
            className='download-btn group relative w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-white text-black text-base sm:text-lg font-medium rounded-full hover:bg-gray-100 transition-all duration-300 transform overflow-hidden'
          >
            <span className='btn-text-original relative z-10 flex items-center justify-center'>
              <FaWindows className='w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3' />
              Download for Windows
            </span>
            <span className='btn-text-hover absolute inset-0 flex items-center justify-center'>
              <FiDownload className='w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3' />
              Get Steam Game Idler
            </span>
          </Link>

          <Link
            href='/docs'
            className='group w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 border border-gray-800 hover:border-gray-700 backdrop-blur-sm text-white text-base sm:text-lg font-medium rounded-full bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-300'
          >
            <span className='flex items-center justify-center'>Documentation</span>
          </Link>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className='grid grid-cols-3 gap-4 sm:flex sm:justify-between sm:items-center max-w-md mx-auto px-4'
        >
          {trustBadges.map(badge => (
            <div key={badge.label} className='flex flex-col items-center space-y-2 sm:space-y-3 text-gray-400'>
              <div className='p-2 sm:p-3 bg-gray-900/50 rounded-xl sm:rounded-2xl border border-gray-800 text-gray-300'>
                <div className='w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8'>{badge.icon}</div>
              </div>
              <div className='text-center'>
                <div className='text-xs sm:text-sm font-medium text-gray-300'>{badge.label}</div>
                <div className='text-xs text-gray-500 hidden lg:block'>{badge.description}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Background Gradients */}
      <div className='absolute top-1 right-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-red-500/8 rounded-full blur-3xl' />
      <div className='absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl' />
      <div className='absolute top-1/7 right-1/4 w-48 h-48 sm:w-80 sm:h-80 bg-purple-500/8 rounded-full blur-3xl' />
      <div className='absolute bottom-0 left-1/2 w-48 h-48 sm:w-90 sm:h-90 bg-green-500/8 rounded-full blur-3xl' />
    </motion.section>
  )
}
