import { FaDiscord, FaGithub } from 'react-icons/fa6'
import { FiMail } from 'react-icons/fi'
import Image from 'next/image'
import Link from 'next/link'

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Download', href: '/download' },
      { label: 'Pro', href: '/pro' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Source code', href: 'https://github.com/zevnda/steam-game-idler', external: true },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'FAQ', href: '/docs/faq' },
      { label: 'Troubleshooting', href: '/docs/troubleshooting' },
      { label: 'Alternatives', href: '/alternatives' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/tos' },
    ],
  },
]

/** The landing page's footer. (Other marketing pages keep the shared FooterSection.) */
export default function LandingFooter() {
  return (
    <footer className='relative pt-20 overflow-hidden'>
      <div className='landing-container'>
        <div className='grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]'>
          <div>
            <Link prefetch={false} href='/' className='inline-flex items-center gap-2.5'>
              <Image src='/logo.png' alt='' width={26} height={26} />
              <span className='font-semibold text-text-primary tracking-tight'>
                Steam Game Idler
              </span>
            </Link>
            <p className='mt-4 max-w-xs text-sm text-text-muted leading-relaxed'>
              A free desktop app for automating your Steam library. Farm cards, manage achievements
              and boost playtime.
            </p>
            <div className='mt-6 flex gap-2'>
              {[
                {
                  href: 'https://github.com/zevnda/steam-game-idler',
                  label: 'GitHub',
                  icon: FaGithub,
                },
                {
                  href: 'https://discord.com/invite/5kY2ZbVnZ8',
                  label: 'Discord',
                  icon: FaDiscord,
                },
                { href: 'mailto:contact@steamgameidler.com', label: 'Email support', icon: FiMail },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel='noopener noreferrer'
                  aria-label={s.label}
                  className='footer-social'
                >
                  <s.icon className='w-4 h-4' />
                </a>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 gap-8'>
            {COLUMNS.map(col => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className='text-xs font-semibold uppercase tracking-[0.16em] text-text-muted'>
                  {col.title}
                </h2>
                <ul className='mt-5 space-y-3'>
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link
                        prefetch={false}
                        href={l.href}
                        target={l.external ? '_blank' : undefined}
                        className='text-sm text-text-muted hover:text-text-primary transition-colors'
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className='mt-16 pt-6 border-t border-white/8 flex flex-col md:flex-row justify-between gap-3 text-xs text-text-muted'>
          <span>© 2024-{new Date().getFullYear()} Steam Game Idler. All rights reserved.</span>
          <span>
            Website created and managed by{' '}
            <Link
              prefetch={false}
              href='https://aswebdesign.com.au/'
              target='_blank'
              rel='noopener'
              className='text-accent hover:opacity-80 transition-opacity'
            >
              AS Web Design
            </Link>
          </span>
          <span>Not affiliated with Valve Corporation.</span>
        </div>
      </div>

      {/* oversized wordmark bleeding off the bottom edge */}
      <div className='footer-wordmark' aria-hidden='true'>
        Steam Game Idler
      </div>
    </footer>
  )
}
