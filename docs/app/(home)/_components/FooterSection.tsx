'use client'

import { useRef } from 'react'
import { FaDiscord } from 'react-icons/fa6'
import { FiBook, FiDownload, FiFileText, FiGithub, FiMail, FiShield } from 'react-icons/fi'
import { motion, useInView } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { ease } from '@/app/lib/motion'

export default function FooterSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.footer
      ref={ref}
      className='py-16 sm:py-20 relative'
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease }}
    >
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='grid lg:grid-cols-3 gap-12 mb-12 sm:mb-16'>
          {/* Brand */}
          <div className='lg:col-span-1'>
            <div className='flex items-center gap-3 mb-4'>
              <Image src='/logo.svg' alt='Steam Game Idler' width={22} height={22} />
              <span className='text-sm font-bold text-text-primary tracking-tight uppercase'>
                Steam Game Idler
              </span>
            </div>
            <p className='text-sm text-text-muted leading-relaxed mb-6'>
              A free, open-source desktop app for automating your Steam library. Farm cards, manage
              achievements, and boost playtime.
            </p>
            <div className='flex gap-2.5'>
              <a
                href='https://github.com/zevnda/steam-game-idler'
                target='_blank'
                rel='noopener noreferrer'
                className='btn-ghost p-2.5'
                aria-label='Visit our GitHub repository'
              >
                <FiGithub className='w-4 h-4' />
              </a>
              <a
                href='https://discord.com/invite/5kY2ZbVnZ8'
                target='_blank'
                rel='noopener noreferrer'
                className='btn-ghost p-2.5'
                aria-label='Join our Discord server'
              >
                <FaDiscord className='w-4 h-4' />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className='lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12'>
            <nav aria-labelledby='resources-heading'>
              <h2
                id='resources-heading'
                className='text-xs font-semibold text-text-muted uppercase tracking-wider mb-5'
              >
                Resources
              </h2>
              <ul className='space-y-3'>
                <li>
                  <Link
                    prefetch={false}
                    href='/download'
                    className='text-sm text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center gap-2'
                  >
                    <FiDownload className='w-3.5 h-3.5 shrink-0' aria-hidden='true' />
                    Download
                  </Link>
                </li>
                <li>
                  <Link
                    prefetch={false}
                    href='/docs'
                    className='text-sm text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center gap-2'
                  >
                    <FiBook className='w-3.5 h-3.5 shrink-0' aria-hidden='true' />
                    Documentation
                  </Link>
                </li>
                <li>
                  <a
                    href='https://github.com/zevnda/steam-game-idler'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center gap-2'
                  >
                    <FiGithub className='w-3.5 h-3.5 shrink-0' aria-hidden='true' />
                    Source Code
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby='legal-heading'>
              <h2
                id='legal-heading'
                className='text-xs font-semibold text-text-muted uppercase tracking-wider mb-5'
              >
                Legal
              </h2>
              <ul className='space-y-3'>
                <li>
                  <Link
                    prefetch={false}
                    href='/privacy'
                    className='text-sm text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center gap-2'
                  >
                    <FiShield className='w-3.5 h-3.5 shrink-0' aria-hidden='true' />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    prefetch={false}
                    href='/tos'
                    className='text-sm text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center gap-2'
                  >
                    <FiFileText className='w-3.5 h-3.5 shrink-0' aria-hidden='true' />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby='contact-heading'>
              <h2
                id='contact-heading'
                className='text-xs font-semibold text-text-muted uppercase tracking-wider mb-5'
              >
                Contact
              </h2>
              <ul className='space-y-3'>
                <li>
                  <a
                    href='mailto:contact@steamgameidler.com'
                    className='text-sm text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center gap-2'
                  >
                    <FiMail className='w-3.5 h-3.5 shrink-0' aria-hidden='true' />
                    Email Support
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4'>
          <div className='text-text-muted text-xs font-mono text-center sm:text-left'>
            © 2024-{new Date().getFullYear()} STEAM GAME IDLER — ALL RIGHTS RESERVED
          </div>
          <div>
            <p className='text-text-muted text-xs font-mono text-center sm:text-left uppercase'>
              Website created and managed by{' '}
              <Link
                prefetch={false}
                href='https://aswebdesign.com.au/'
                target='_blank'
                rel='noopener'
                className='text-accent hover:opacity-80 transition-opacity duration-150'
              >
                AS Web Design
              </Link>
            </p>
          </div>
          <div className='text-text-muted text-xs uppercase tracking-wider text-center sm:text-right'>
            NOT AFFILIATED WITH VALVE CORPORATION
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
