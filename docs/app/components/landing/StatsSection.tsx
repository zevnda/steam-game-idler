'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiDownload, FiGlobe, FiStar } from 'react-icons/fi'
import { TbCode } from 'react-icons/tb'

// Custom hook for counting animation
function useCountUp(target: number, duration: number = 2000, inView: boolean = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return

    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(target * easeOut))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration, inView])

  return count
}

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

const stats = [
  { number: '15K+', label: 'Downloads', icon: <FiDownload className='w-5 h-5' /> },
  { number: '11', label: 'Languages', icon: <FiGlobe className='w-5 h-5' /> },
  { number: '100%', label: 'Open Source', icon: <TbCode className='w-5 h-5' /> },
  { number: '160', label: 'GitHub Stars', icon: <FiStar className='w-5 h-5' /> },
]

function parseStatNumber(numberStr: string) {
  const match = numberStr.match(/^(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return { value: 0, suffix: '' }
  return { value: parseFloat(match[1]), suffix: match[2] }
}

export default function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.section
      ref={ref}
      className='relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-900 overflow-hidden'
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Background Gradients */}
      <div className='absolute top-0 left-1/3 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl' />
      <div className='absolute bottom-0 right-1/4 w-48 h-48 sm:w-80 sm:h-80 bg-violet-500/8 rounded-full blur-3xl' />
      <div className='absolute top-1/2 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-orange-500/6 rounded-full blur-3xl' />

      <div className='relative z-10 max-w-6xl mx-auto'>
        <motion.div variants={itemVariants} className='text-center mb-12 sm:mb-16 lg:mb-20'>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4 sm:mb-6'>
            Trusted by Steam users worldwide
          </h2>
          <p className='text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto px-4'>
            Join thousands of users who use our open-source tool
          </p>
        </motion.div>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
          {stats.map((stat, index) => {
            const { value, suffix } = parseStatNumber(stat.number)
            const animatedValue = useCountUp(value, 2000 + index * 200, isInView)

            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className='text-center p-4 sm:p-6 lg:p-8 bg-gray-900/30 rounded-2xl sm:rounded-3xl border border-gray-800 backdrop-blur-sm'
              >
                <div className='text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-light text-white mb-1 sm:mb-2'>
                  {animatedValue}
                  {suffix}
                </div>
                <div className='flex items-center justify-center gap-1 w-full text-gray-400 text-xs sm:text-sm font-medium'>
                  <span className='flex justify-center text-gray-400'>{stat.icon}</span>
                  {stat.label}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
