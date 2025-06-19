'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiDownload, FiGlobe, FiStar } from 'react-icons/fi'
import { TbCode } from 'react-icons/tb'

async function fetchGitHubStars(): Promise<number> {
  try {
    const response = await fetch('/api/github-stars')
    if (!response.ok) {
      throw new Error('Failed to fetch repository data')
    }
    const data = await response.json()
    return data.stars
  } catch (error) {
    console.error('Error fetching GitHub stars:', error)
    return 160
  }
}

function useCountUp(target: number, duration: number = 2000, inView: boolean = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView || target === 0) return

    setCount(0) // Reset count when starting new animation
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

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
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 50, rotateX: -15 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

export default function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [githubStars, setGithubStars] = useState(0) // Start with 0 instead of 160
  const [isLoadingStars, setIsLoadingStars] = useState(true)

  useEffect(() => {
    const loadGitHubStars = async () => {
      setIsLoadingStars(true)
      const stars = await fetchGitHubStars()
      setGithubStars(stars)
      setIsLoadingStars(false)
    }

    loadGitHubStars()
  }, [])

  const stats = [
    {
      number: '15000',
      label: 'Downloads',
      icon: <FiDownload className='w-6 h-6' />,
      color: 'from-blue-500 to-cyan-500',
      link: 'https://github.com/zevnda/steam-game-idler/releases',
    },
    {
      number: '42',
      label: 'Languages',
      icon: <FiGlobe className='w-6 h-6' />,
      color: 'from-emerald-500 to-teal-500',
      link: 'https://crowdin.com/project/steam-game-idler',
    },
    {
      number: '100',
      label: 'Open Source',
      icon: <TbCode className='w-6 h-6' />,
      color: 'from-purple-500 to-violet-500',
      link: 'https://github.com/zevnda/steam-game-idler',
    },
    {
      number: githubStars.toString(),
      label: 'GitHub Stars',
      icon: <FiStar className='w-6 h-6' />,
      color: 'from-orange-500 to-red-500',
      link: 'https://github.com/zevnda/steam-game-idler/stargazers',
    },
  ]

  function parseStatNumber(numberStr: string) {
    const match = numberStr.match(/^(\d+(?:\.\d+)?)(.*)$/)
    if (!match) return { value: 0, suffix: '' }
    return { value: parseFloat(match[1]), suffix: match[2] }
  }

  return (
    <motion.section
      ref={ref}
      className='relative py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50 overflow-hidden'
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Enhanced Background Gradients */}
      <motion.div
        className='absolute top-0 left-1/3 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/8 to-blue-500/8 rounded-full blur-3xl'
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className='absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/6 to-purple-500/6 rounded-full blur-3xl'
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
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
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Trusted by Steam users{' '}
            <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
              worldwide
            </span>
          </motion.h2>
          <motion.p
            className='text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto px-4 leading-relaxed'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Join thousands of users who use our open-source tool
          </motion.p>
        </motion.div>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10'>
          {stats.map((stat, index) => {
            const { value, suffix } = parseStatNumber(stat.number)
            const animatedValue = useCountUp(value, 2000, isInView && !isLoadingStars)

            return (
              <motion.a
                key={stat.label}
                href={stat.link}
                target='_blank'
                rel='noopener'
                variants={cardVariants}
                custom={index}
                className='group relative block cursor-pointer'
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.2 },
                }}
              >
                <div className='absolute inset-0 bg-gradient-to-br from-gray-800/30 to-gray-900/50 rounded-3xl backdrop-blur-xl border border-gray-700/30 shadow-2xl group-hover:shadow-3xl transition-all duration-500' />
                <div className='relative text-center p-6 sm:p-8 lg:p-10'>
                  <motion.div
                    className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${stat.color} rounded-2xl mb-4 sm:mb-6 shadow-lg`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className='text-white'>{stat.icon}</div>
                  </motion.div>

                  <motion.div
                    className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light text-white mb-2 sm:mb-3'
                    initial={{ scale: 0.5 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    {stat.label === 'GitHub Stars' && isLoadingStars ? (
                      <span className='animate-pulse'>...</span>
                    ) : (
                      <>
                        {stat.number === '15000'
                          ? `${Math.floor(animatedValue / 1000)}K`
                          : stat.number === '100'
                            ? `${animatedValue}%`
                            : `${animatedValue}`}
                        {stat.number !== '15000' && stat.number !== '100' && suffix}
                      </>
                    )}
                  </motion.div>

                  <div className='text-gray-400 text-sm sm:text-base font-medium tracking-wide'>{stat.label}</div>
                </div>

                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-200 blur-xl`}
                />
              </motion.a>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
