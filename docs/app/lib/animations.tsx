'use client'

import type { ReactNode } from 'react'
import { useRef } from 'react'
import { motion, MotionConfig, useInView } from 'motion/react'
import { ease } from '@/app/lib/motion'

// Both wrappers honour the OS "reduce motion" setting via MotionConfig's `reducedMotion='user'`:
// the slide (a transform) is skipped and content only fades. Decided at animation time rather
// than render time, so server and client markup stay identical (no hydration mismatch).

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  immediate?: boolean
}

/** Fades + slides content up once it scrolls into view. Pass `immediate` for above-the-fold content. */
export function FadeIn({ children, className, delay = 0, y = 24, immediate = false }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const show = immediate || inView

  return (
    <MotionConfig reducedMotion='user'>
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, y }}
        animate={show ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease, delay }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}

interface StaggerGroupProps {
  children: ReactNode
  className?: string
}

/** Wraps a list of StaggerItem children, staggering their entrance once the group scrolls into view. */
export function StaggerGroup({ children, className }: StaggerGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <MotionConfig reducedMotion='user'>
      <motion.div
        ref={ref}
        className={className}
        variants={staggerContainer}
        initial='hidden'
        animate={inView ? 'show' : 'hidden'}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}
