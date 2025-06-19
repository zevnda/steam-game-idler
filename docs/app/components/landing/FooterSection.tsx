'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { FiBookOpen, FiFileText, FiGithub, FiShield } from 'react-icons/fi'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

export default function FooterSection() {
  return (
    <motion.footer
      className='relative py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50 overflow-hidden'
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Background Gradients */}
      <div className='absolute inset-0 bg-gradient-to-t from-black via-gray-900/20 to-transparent' />
      <motion.div
        className='absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-sky-500/5 rounded-full blur-3xl'
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className='relative max-w-7xl mx-auto'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12'>
          {/* Logo and Description */}
          <motion.div className='md:col-span-2' variants={itemVariants}>
            <div className='flex items-center gap-3 mb-4'>
              <Image src='/logo.png' alt='Logo' width={24} height={24} className='w-12 h-12 lg:w-6 lg:h-6' />
              <h3 className='text-xl font-bold'>Steam Game Idler</h3>
            </div>
            <p className='text-gray-400 text-sm leading-relaxed max-w-md'>
              The ultimate desktop application for managing your Steam gaming activities. Idle games, farm trading
              cards, unlock achievements, and optimize your Steam experience.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className='text-white font-semibold mb-4 text-sm uppercase tracking-wider'>Quick Links</h4>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/docs'
                  className='text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2 group'
                >
                  <FiBookOpen className='w-4 h-4 group-hover:text-blue-400 transition-colors' />
                  Documentation
                </Link>
              </li>
              <li>
                <a
                  href='https://github.com/ProbablyRaging/steam-game-idler'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2 group'
                >
                  <FiGithub className='w-4 h-4 group-hover:text-blue-400 transition-colors' />
                  GitHub Repository
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants}>
            <h4 className='text-white font-semibold mb-4 text-sm uppercase tracking-wider'>Legal</h4>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/privacy'
                  className='text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2 group'
                >
                  <FiShield className='w-4 h-4 group-hover:text-blue-400 transition-colors' />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href='/tos'
                  className='text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2 group'
                >
                  <FiFileText className='w-4 h-4 group-hover:text-blue-400 transition-colors' />
                  Terms of Service
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className='mt-12 pt-8 border-t border-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4'
          variants={itemVariants}
        >
          <p className='text-gray-500 text-sm'>
            © 2024 - {new Date().getFullYear()} Steam Game Idler. All rights reserved.
          </p>
          <p className='text-gray-500 text-xs'>Not affiliated with Valve Corporation or Steam.</p>
        </motion.div>
      </div>
    </motion.footer>
  )
}
