'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { FaWindows } from 'react-icons/fa'
import { FiGithub, FiZap } from 'react-icons/fi'
import { MdOutlineVerified } from 'react-icons/md'

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

const logoVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -180 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 1.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const titleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const letterVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
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

const title = 'Steam Game Idler'

export default function HeroSection() {
  return (
    <motion.section
      className='relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Enhanced Background Gradients */}
      <div className='absolute inset-0 bg-gradient-to-b from-black via-gray-900/20 to-black' />
      <motion.div
        className='absolute top-1/4 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-3xl'
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className='absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-emerald-500/12 to-cyan-500/12 rounded-full blur-3xl'
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className='relative z-10 max-w-6xl mx-auto text-center'>
        <motion.div variants={logoVariants} className='mb-6 sm:mb-8'>
          <motion.div
            className='inline-flex items-center justify-center w-20 h-20 lg:w-28 lg:h-28 bg-gradient-to-br from-gray-800/50 to-gray-900/80 rounded-3xl border border-gray-700/50 backdrop-blur-xl mb-6 sm:mb-8 shadow-2xl'
            whileHover={{
              scale: 1.1,
              rotate: 5,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            transition={{ duration: 0.3 }}
          >
            <Image src='/logo.png' alt='Logo' width={60} height={60} className='w-12 h-12 lg:w-16 lg:h-16' />
          </motion.div>
        </motion.div>

        <motion.h1
          variants={titleVariants}
          className='text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight mb-4 sm:mb-6 leading-none px-2'
        >
          <span className='bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent'>
            {title.split('').map((letter, index) => (
              <motion.span key={index} variants={letterVariants} className='inline-block'>
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className='max-w-3xl mx-auto text-lg sm:text-xl lg:text-2xl font-light text-gray-300 mb-8 sm:mb-12 leading-relaxed px-4'
        >
          A powerful Steam idler for farming trading cards, managing achievements, and boosting playtime. The most
          advanced Steam card idler available.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className='flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4'
        >
          <motion.div className='flex w-full sm:w-auto' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href='https://github.com/zevnda/steam-game-idler/releases/latest'
              className='group relative w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-white to-gray-100 text-black text-base sm:text-lg font-semibold rounded-full transition-all duration-500 transform overflow-hidden shadow-2xl hover:shadow-white/25'
            >
              <span className='relative z-10 flex items-center justify-center transition-all duration-300 group-hover:scale-110'>
                <FaWindows className='w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3' />
                Download for Windows
              </span>
              <div className='absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
            </Link>
          </motion.div>

          <motion.div className='flex w-full sm:w-auto' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href='/docs'
              className='group relative w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 border border-gray-600/50 backdrop-blur-xl text-white text-base sm:text-lg font-semibold rounded-full bg-gradient-to-r from-gray-800/30 to-gray-900/30 hover:from-gray-700/40 hover:to-gray-800/40 transition-all duration-500 shadow-xl hover:shadow-2xl'
            >
              <span className='flex items-center justify-center'>Documentation</span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className='grid grid-cols-3 gap-4 sm:flex sm:justify-center sm:space-x-8 max-w-2xl mx-auto px-4'
        >
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.label}
              variants={badgeVariants}
              className='flex flex-col items-center space-y-2 sm:space-y-3 text-gray-400'
              whileHover={{ scale: 1.1, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className='p-3 sm:p-4 bg-gradient-to-br from-gray-800/60 to-gray-900/80 rounded-2xl border border-gray-700/50 text-gray-300 backdrop-blur-xl shadow-xl'>
                <div className='w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8'>{badge.icon}</div>
              </div>
              <div className='text-center'>
                <div className='text-xs sm:text-sm font-semibold text-gray-200'>{badge.label}</div>
                <div className='text-xs text-gray-500 hidden lg:block'>{badge.description}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}
