'use client'

import { useEffect, useState } from 'react'
import { FaWindows } from 'react-icons/fa6'
import { FiMenu, FiX } from 'react-icons/fi'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useGlobalStore } from '@/app/lib/globalStore'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { downloadUrl } = useGlobalStore(state => state)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const linkClass =
    'px-3 py-1.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors duration-150 rounded-md'

  const drawerLinkClass =
    'flex items-center px-4 py-3 text-base text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors duration-150 rounded-md'

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/alternatives', label: 'Compare' },
    { href: '/changelog', label: 'Changelog' },
    { href: '/docs', label: 'Docs' },
    { href: '/pro', label: 'PRO', bold: true },
  ]

  return (
    <>
      <header
        className='fixed top-0 inset-x-0 z-50 transition-all duration-300'
        style={{
          background: scrolled ? 'rgba(0,0,0,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        }}
      >
        <div className='container mx-auto px-4 sm:px-6 md:px-8 h-14 flex items-center justify-between gap-4'>
          {/* Logo */}
          <Link prefetch={false} href='/' className='flex items-center gap-2.5 shrink-0'>
            <Image src='/logo.svg' alt='Steam Game Idler' width={24} height={24} loading='eager' />
            <span className='font-bold text-text-primary tracking-tight block'>
              Steam Game Idler
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className='hidden md:flex items-center gap-0.5'>
            {navLinks.map(({ href, label, bold }) => (
              <Link
                key={href}
                prefetch={false}
                href={href}
                className={`${linkClass}${bold ? ' font-bold' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop download CTA */}
          <Link
            prefetch={false}
            href={downloadUrl}
            className='btn-download shrink-0 hidden md:inline-flex'
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
          >
            <FaWindows className='w-3.5 h-3.5' />
            Download
          </Link>

          {/* Mobile hamburger */}
          <button
            className='md:hidden p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-md transition-colors duration-150'
            onClick={() => setDrawerOpen(true)}
            aria-label='Open menu'
          >
            <FiMenu className='w-5 h-5' />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key='backdrop'
              className='fixed inset-0 z-50 bg-black/60 md:hidden'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key='drawer'
              className='fixed top-0 right-0 z-50 h-full w-72 md:hidden flex flex-col'
              style={{
                background: 'rgba(13,13,13,0.98)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderLeft: '1px solid var(--color-border)',
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Drawer header */}
              <div
                className='flex items-center justify-end px-4 h-14 shrink-0'
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <button
                  className='p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-md transition-colors duration-150'
                  onClick={() => setDrawerOpen(false)}
                  aria-label='Close menu'
                >
                  <FiX className='w-5 h-5' />
                </button>
              </div>

              {/* Drawer nav links */}
              <nav className='flex flex-col gap-1 p-3 flex-1'>
                {navLinks.map(({ href, label, bold }) => (
                  <Link
                    key={href}
                    prefetch={false}
                    href={href}
                    className={`${drawerLinkClass}${bold ? ' font-bold' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Drawer download CTA */}
              <div className='p-4 shrink-0' style={{ borderTop: '1px solid var(--color-border)' }}>
                <Link
                  prefetch={false}
                  href={downloadUrl}
                  className='btn-download w-full justify-center'
                  style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
                  onClick={() => setDrawerOpen(false)}
                >
                  <FaWindows className='w-4 h-4' />
                  Download for Windows
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
