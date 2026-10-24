'use client'

import { useEffect, useState } from 'react'
import { FaDiscord, FaGithub } from 'react-icons/fa6'
import { FiChevronRight, FiMenu, FiX } from 'react-icons/fi'
import { scrollBehavior, scrollToPlayground } from './demoStore'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'

// `group` only matters to the mobile sheet, which lists the home page's sections and the site's
// pages separately (and gives PRO its own card); the desktop pill shows them all in one row.
const LINKS = [
  { href: '#demo', label: 'Demo', group: 'explore' },
  { href: '#features', label: 'Features', group: 'explore' },
  { href: '#compare', label: 'Compare', group: 'explore' },
  { href: '/docs', label: 'Docs', group: 'resources' },
  { href: '/changelog', label: 'Changelog', group: 'resources' },
  { href: '/blog', label: 'Blog', group: 'resources' },
  { href: '/pro', label: 'PRO', group: 'pro', pro: true },
] as const

const SHEET_GROUPS = [
  { id: 'explore', label: 'Explore' },
  { id: 'resources', label: 'Resources' },
] as const

// Same destinations and icons as the footer's social links (LandingFooter.tsx)
const SOCIALS = [
  { href: 'https://github.com/zevnda/steam-game-idler', label: 'GitHub', icon: FaGithub },
  { href: 'https://discord.com/invite/5kY2ZbVnZ8', label: 'Discord', icon: FaDiscord },
]

const iconButtonClass =
  'p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors'

/**
 * The marketing site's navigation, shared by the home page and every inner marketing page: a
 * floating pill that firms up once you scroll. On the home page the in-page links scroll smoothly
 * ("Demo" jumps straight to the docked playground rather than the top of the showcase); anywhere
 * else they point back at the home page's sections.
 */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const onHome = pathname === '/'
  // in-page anchors only exist on the home page
  const links = LINKS.map(l => ({
    ...l,
    href: l.href.startsWith('#') && !onHome ? `/${l.href}` : l.href,
    current: !l.href.startsWith('#') && (pathname === l.href || pathname.startsWith(`${l.href}/`)),
  }))
  const pro = links.find(l => l.group === 'pro')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return
    // Esc closes the sheet, as it would any dialog
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onLink = (e: React.MouseEvent, href: string) => {
    setOpen(false)
    if (!href.startsWith('#')) return
    e.preventDefault()
    if (href === '#demo') return scrollToPlayground()
    document.querySelector(href)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  }

  // stagger index for the sheet's entrance (.landing-sheet__item)
  let item = 0
  const stagger = () => ({ '--i': item++ }) as React.CSSProperties

  return (
    <>
      <header className='fixed inset-x-0 top-3 z-50 px-3 sm:px-5 pointer-events-none'>
        <div className={`landing-nav pointer-events-auto ${scrolled ? 'landing-nav--solid' : ''}`}>
          <Link prefetch={false} href='/' className='flex items-center gap-2.5 pl-1.5 shrink-0'>
            <Image src='/logo.png' alt='' width={22} height={22} loading='eager' />
            <span className='font-semibold tracking-tight text-text-primary'>Steam Game Idler</span>
          </Link>

          <nav aria-label='Main' className='hidden md:flex items-center gap-0.5'>
            {links.map(l => (
              <Link
                key={l.href}
                prefetch={false}
                href={l.href}
                onClick={e => onLink(e, l.href)}
                aria-current={l.current ? 'page' : undefined}
                className={`landing-nav__link ${'pro' in l ? 'landing-nav__link--pro' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className='flex items-center gap-2'>
            {/* lg+ only: between md and lg the seven links already fill the pill - smaller
                screens get these in the menu sheet instead */}
            <div className='hidden lg:flex items-center'>
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={s.label}
                  className={iconButtonClass}
                >
                  <s.icon className='w-[18px] h-[18px]' />
                </a>
              ))}
            </div>
            <DownloadButton
              label='Download'
              className='hidden sm:inline-flex'
              iconClassName='w-3.5 h-3.5'
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.8125rem' }}
            />
            <button
              type='button'
              className={`md:hidden ${iconButtonClass}`}
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
        <div className='landing-sheet__glow' aria-hidden='true' />

        {/* the same row, at the same spot, as the nav pill - opening reads as the pill unfolding */}
        <div className='relative px-3 sm:px-5 pt-3'>
          <div className='landing-nav'>
            <Link
              prefetch={false}
              href='/'
              onClick={() => setOpen(false)}
              className='flex items-center gap-2.5 pl-1.5 shrink-0'
            >
              <Image src='/logo.png' alt='' width={22} height={22} />
              <span className='font-semibold tracking-tight text-text-primary'>
                Steam Game Idler
              </span>
            </Link>
            <button
              type='button'
              className={iconButtonClass}
              onClick={() => setOpen(false)}
              aria-label='Close menu'
            >
              <FiX className='w-5 h-5' />
            </button>
          </div>
        </div>

        <nav aria-label='Mobile' className='relative flex-1 overflow-y-auto px-4 pt-6 pb-4'>
          {SHEET_GROUPS.map(g => (
            <div key={g.id} className='landing-sheet__item mb-5' style={stagger()}>
              <p className='px-2 mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-muted'>
                {g.label}
              </p>
              <ul className='sheet-group'>
                {links
                  .filter(l => l.group === g.id)
                  .map(l => (
                    <li key={l.href}>
                      <Link
                        prefetch={false}
                        href={l.href}
                        onClick={e => onLink(e, l.href)}
                        aria-current={l.current ? 'page' : undefined}
                        className='sheet-link'
                      >
                        {l.label}
                        <FiChevronRight className='sheet-link__chevron' aria-hidden='true' />
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          {/* PRO gets its own card, in the rainbow rim the release banner and 3D window use */}
          {pro && (
            <div className='landing-sheet__item' style={stagger()}>
              <Link
                prefetch={false}
                href={pro.href}
                onClick={() => setOpen(false)}
                aria-current={pro.current ? 'page' : undefined}
                className='rainbow-chip sheet-pro'
              >
                <span className='rainbow-chip__inner sheet-pro__inner'>
                  <span className='min-w-0'>
                    <span className='block text-lg font-semibold tracking-[-0.01em]'>PRO</span>
                    <span className='block mt-0.5 text-[13px] font-normal text-text-muted truncate'>
                      Extra features, and support development
                    </span>
                  </span>
                  <FiChevronRight className='sheet-link__chevron shrink-0' aria-hidden='true' />
                </span>
              </Link>
            </div>
          )}
        </nav>

        {/* pinned to the bottom; clears the home indicator on notched phones */}
        <div
          className='landing-sheet__item relative px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2'
          style={stagger()}
        >
          <DownloadButton className='flex-1 justify-center' onClick={() => setOpen(false)} />
          {SOCIALS.map(s => (
            <a
              key={s.label}
              href={s.href}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={s.label}
              className='footer-social w-12! h-12!'
            >
              <s.icon className='w-5 h-5' />
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
