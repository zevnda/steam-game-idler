'use client'

import { useEffect, useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import { scrollBehavior, scrollToPlayground } from './demoStore'
import Image from 'next/image'
import Link from 'next/link'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'

const LINKS = [
  { href: '#demo', label: 'Demo' },
  { href: '#features', label: 'Features' },
  { href: '#compare', label: 'Compare' },
  { href: '/docs', label: 'Docs' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/pro', label: 'PRO', pro: true },
]

/**
 * The landing page's own navigation: a floating glass pill that firms up once you scroll. (Other
 * marketing pages keep the shared NavBar.) In-page links scroll smoothly; "Demo" jumps straight
 * to the docked playground rather than the top of the showcase.
 */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const onLink = (e: React.MouseEvent, href: string) => {
    setOpen(false)
    if (!href.startsWith('#')) return
    e.preventDefault()
    if (href === '#demo') return scrollToPlayground()
    document.querySelector(href)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  }

  return (
    <>
      <header className='fixed inset-x-0 top-3 z-50 px-3 sm:px-5 pointer-events-none'>
        <div className={`landing-nav pointer-events-auto ${scrolled ? 'landing-nav--solid' : ''}`}>
          <Link prefetch={false} href='/' className='flex items-center gap-2.5 pl-1.5 shrink-0'>
            <Image src='/logo.png' alt='' width={22} height={22} loading='eager' />
            <span className='font-semibold tracking-tight text-text-primary'>Steam Game Idler</span>
          </Link>

          <nav aria-label='Main' className='hidden md:flex items-center gap-0.5'>
            {LINKS.map(l => (
              <Link
                key={l.href}
                prefetch={false}
                href={l.href}
                onClick={e => onLink(e, l.href)}
                className={`landing-nav__link ${l.pro ? 'landing-nav__link--pro' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className='flex items-center gap-2'>
            <DownloadButton
              label='Download'
              className='hidden sm:inline-flex'
              iconClassName='w-3.5 h-3.5'
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.8125rem' }}
            />
            <button
              type='button'
              className='md:hidden p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5'
              onClick={() => setOpen(true)}
              aria-label='Open menu'
            >
              <FiMenu className='w-5 h-5' />
            </button>
          </div>
        </div>
      </header>

      {/*
        Always mounted and toggled by class (not `{open && ...}`) so it can animate out as well as
        in - unmounting made it vanish instantly on close. `inert` keeps the closed sheet out of
        the tab order and the accessibility tree.
      */}
      <div
        className={`landing-sheet md:hidden ${open ? 'landing-sheet--open' : ''}`}
        role='dialog'
        aria-modal='true'
        aria-label='Menu'
        inert={!open}
      >
        <div className='flex items-center justify-between px-5 h-16'>
          <span className='font-semibold text-text-primary'>Steam Game Idler</span>
          <button
            type='button'
            className='p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5'
            onClick={() => setOpen(false)}
            aria-label='Close menu'
          >
            <FiX className='w-5 h-5' />
          </button>
        </div>
        <nav aria-label='Mobile' className='flex flex-col px-5 pt-4'>
          {LINKS.map(l => (
            <Link
              key={l.href}
              prefetch={false}
              href={l.href}
              onClick={e => onLink(e, l.href)}
              className='py-4 text-3xl font-semibold tracking-tight text-text-primary border-b border-white/8'
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className='px-5 mt-8'>
          <DownloadButton className='w-full justify-center' onClick={() => setOpen(false)} />
        </div>
      </div>
    </>
  )
}
