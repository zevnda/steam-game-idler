'use client'

import { useEffect, useState } from 'react'
import { FiChevronRight, FiMenu, FiX } from 'react-icons/fi'
import { scrollBehavior } from './demoStore'
import { LINKS, SOCIALS } from './navLinks'
import { Unbounded } from 'next/font/google'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/app/(marketing)/_components/Logo'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'

const SHEET_GROUPS = [
  { id: 'explore', label: 'Explore' },
  { id: 'resources', label: 'Resources' },
] as const

interface LandingNavProps {
  /** extra controls shown below md, before the menu button - the docs use it for their search
   *  trigger, which the docs layout's own mobile header used to hold */
  actions?: React.ReactNode
  /** content at the top of the phone menu sheet, above the site's own groups - the docs put
   *  their sections here (DocsSheetTree), so docs pages keep this one menu rather than adding a
   *  second. Any link clicked inside it closes the sheet. */
  sheetLead?: React.ReactNode
}

// The desktop app's titlebar wordmark face (src/shared/components/titlebar/Titlebar.tsx), so the
// site's brand reads the same as the app's. Preloaded (unlike Showcase.tsx's lazy copy of the same
// font) since this nav is above the fold on every page.
const unbounded = Unbounded({ subsets: ['latin'] })

const brandClass = `${unbounded.className} text-sm font-semibold text-text-primary`

const iconButtonClass =
  'p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors'

/**
 * The marketing site's navigation, shared by the home page and every inner marketing page: a flat,
 * full-width bar on the page's own black, pinned to the top, that never changes on scroll. On the
 * home page the in-page links scroll smoothly; anywhere else they point back at the home page's
 * sections.
 */
export default function LandingNav({ actions, sheetLead }: LandingNavProps) {
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
    // Home while already home: back to the top (a same-route link would otherwise do nothing)
    if (href === '/' && onHome) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: scrollBehavior() })
      return
    }
    if (!href.startsWith('#')) return
    e.preventDefault()
    document.querySelector(href)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  }

  // stagger index for the sheet's entrance (.landing-sheet__item)
  let item = 0
  const stagger = () => ({ '--i': item++ }) as React.CSSProperties

  return (
    <>
      <header className='landing-header fixed inset-x-0 top-0 z-50'>
        <div className='landing-nav'>
          <Link prefetch={false} href='/' className='flex items-center gap-2.5 shrink-0'>
            <Logo size={22} />
            <span className={brandClass}>Steam Game Idler</span>
          </Link>

          <nav aria-label='Main' className='hidden md:flex items-center gap-0.5'>
            {links.map(l =>
              'pro' in l ? (
                // the rainbow rim the release banner and the mobile sheet's PRO card use
                <Link
                  key={l.href}
                  prefetch={false}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={l.current ? 'page' : undefined}
                  className='rainbow-chip rainbow-chip--glow landing-nav__pro'
                >
                  <span className='rainbow-chip__inner landing-nav__pro-inner'>{l.label}</span>
                </Link>
              ) : (
                <Link
                  key={l.href}
                  prefetch={false}
                  href={l.href}
                  onClick={e => onLink(e, l.href)}
                  aria-current={l.current ? 'page' : undefined}
                  // Home is dropped between md and lg, where the bar can't fit it beside the
                  // Download button - the logo beside it links home anyway
                  className={`landing-nav__link ${l.href === '/' ? 'max-lg:hidden' : ''}`}
                >
                  {l.label}
                </Link>
              ),
            )}
          </nav>

          <div className='flex items-center gap-2'>
            {/* lg+ only: between md and lg the six links already fill the bar - smaller
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
                  <s.icon className='w-4.5 h-4.5' />
                </a>
              ))}
            </div>
            <DownloadButton
              label='Download'
              className='hidden sm:inline-flex'
              iconClassName='w-3.5 h-3.5'
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.8125rem' }}
            />
            {actions && <div className='flex md:hidden items-center'>{actions}</div>}
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
        {/* the same row, at the same spot, as the nav bar - the menu opens over it seamlessly */}
        <div className='relative'>
          <div className='landing-nav'>
            <Link
              prefetch={false}
              href='/'
              onClick={() => setOpen(false)}
              className='flex items-center gap-2.5 shrink-0'
            >
              <Logo size={22} />
              <span className={brandClass}>Steam Game Idler</span>
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
          {sheetLead && (
            // one entrance step for the whole block; closes the sheet on any link inside it
            // (its own buttons, like a folder toggle, leave it open)
            <div
              className='landing-sheet__item'
              style={stagger()}
              onClick={e => {
                if ((e.target as Element).closest('a')) setOpen(false)
              }}
            >
              {sheetLead}
            </div>
          )}
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
