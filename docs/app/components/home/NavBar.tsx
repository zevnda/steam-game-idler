'use client'

import { useEffect, useState } from 'react'
import { FaWindows } from 'react-icons/fa6'
import { useGlobalStore } from '@docs/stores/globalStore'
import Image from 'next/image'
import Link from 'next/link'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const { downloadUrl } = useGlobalStore(state => state)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass =
    'px-3 py-1.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors duration-150 rounded-md'

  return (
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
          <Image src='/logo.svg' alt='Steam Game Idler' width={24} height={24} />
          <span className='font-bold text-text-primary tracking-tight hidden sm:block'>
            Steam Game Idler
          </span>
        </Link>

        {/* Nav links */}
        <nav className='hidden md:flex items-center gap-0.5'>
          <Link prefetch={false} href='/#features' className={linkClass}>
            Features
          </Link>
          <Link prefetch={false} href='/changelog' className={linkClass}>
            Changelog
          </Link>
          <Link prefetch={false} href='/docs' className={linkClass}>
            Docs
          </Link>
          <Link prefetch={false} href='/pro' className={`${linkClass} font-bold`}>
            PRO
          </Link>
        </nav>

        {/* Download CTA */}
        <Link
          prefetch={false}
          href={downloadUrl}
          className='btn-download shrink-0 hidden sm:inline-flex'
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
        >
          <FaWindows className='w-3.5 h-3.5' />
          Download Free
        </Link>
      </div>
    </header>
  )
}
