'use client'

import { FaGithub, FaStar } from 'react-icons/fa6'
import { FiArrowUpRight } from 'react-icons/fi'
import { TbCloudOff, TbCode, TbKey, TbTag } from 'react-icons/tb'
import SectionHeading from './SectionHeading'
import { FadeIn } from '@/app/lib/animations'
import { useGlobalStore } from '@/app/lib/globalStore'

const POINTS = [
  {
    icon: TbCode,
    title: 'Every line is public',
    body: 'The whole app lives on GitHub. Read it, audit it, or build it yourself.',
  },
  {
    icon: TbKey,
    title: 'Secrets stay in your OS',
    body: 'Steam session cookies and credentials live in your operating system’s credential manager - never in plaintext, never in the cloud.',
  },
  {
    icon: TbCloudOff,
    title: 'Your data stays on your device',
    body: 'No cloud sync - your settings, caches and logs are stored locally, on your machine.',
  },
]

// The real languages the repo is written in (desktop app, frontend, SteamUtility helper).
const LANGUAGES = [
  ['Rust', '#dea584'],
  ['TypeScript', '#3178c6'],
  ['C#', '#178600'],
]

/**
 * Trust, said plainly - replaces the old animated "security audit" terminal, whose scripted
 * checks (hash matching, code-signing verification) read like verification that never runs.
 */
export default function OpenSource() {
  const { repoStars, latestVersion } = useGlobalStore(s => s)

  return (
    <section aria-labelledby='trust-heading' className='landing-section'>
      <div className='landing-container grid lg:grid-cols-2 gap-14 lg:gap-20 items-center'>
        <div>
          <SectionHeading
            id='trust-heading'
            align='left'
            eyebrow='Open & secure'
            title={
              <>
                Nothing to <span className='gradient-text'>hide.</span>
              </>
            }
            sub='A tool that touches your Steam account should be one you can inspect. So it is.'
          />
          <FadeIn className='mt-10 space-y-7' delay={0.1}>
            {POINTS.map(p => (
              <div key={p.title} className='flex gap-4'>
                <span className='trust-icon' aria-hidden='true'>
                  <p.icon className='w-5 h-5' />
                </span>
                <div>
                  <h3 className='font-semibold text-text-primary'>{p.title}</h3>
                  <p className='mt-1 text-[15px] text-text-muted leading-relaxed'>{p.body}</p>
                </div>
              </div>
            ))}
          </FadeIn>
        </div>

        <FadeIn delay={0.15}>
          <a
            href='https://github.com/zevnda/steam-game-idler'
            target='_blank'
            rel='noopener noreferrer'
            className='repo-card group'
          >
            <div className='flex items-center gap-3'>
              <FaGithub className='w-7 h-7 text-text-primary' />
              <div className='text-lg'>
                <span className='text-text-muted'>zevnda / </span>
                <span className='font-semibold text-text-primary'>steam-game-idler</span>
              </div>
              <FiArrowUpRight className='ml-auto w-5 h-5 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all' />
            </div>
            <p className='mt-5 text-[15px] text-text-muted leading-relaxed'>
              Automate your Steam library: farm trading cards, manage achievements, boost playtime
              and manage your inventory - from one desktop app for Windows and Linux.
            </p>
            <div className='mt-6 flex flex-wrap gap-2'>
              {LANGUAGES.map(([name, color]) => (
                <span key={name} className='repo-chip'>
                  <i style={{ background: color }} />
                  {name}
                </span>
              ))}
            </div>
            <div className='mt-7 grid grid-cols-3 border-t border-white/8 pt-6'>
              <div>
                <div className='flex items-center gap-1.5 text-xl font-semibold text-text-primary'>
                  <FaStar className='w-4 h-4 text-amber-300' />
                  {repoStars.toLocaleString()}
                </div>
                <div className='text-xs text-text-muted mt-1'>Stars</div>
              </div>
              <div>
                <div className='flex items-center gap-1.5 text-xl font-semibold text-text-primary'>
                  <TbTag className='w-4 h-4 text-text-muted' />
                  {latestVersion}
                </div>
                <div className='text-xs text-text-muted mt-1'>Latest release</div>
              </div>
              <div>
                <div className='text-xl font-semibold text-text-primary'>Elastic-2.0</div>
                <div className='text-xs text-text-muted mt-1'>License</div>
              </div>
            </div>
          </a>
        </FadeIn>
      </div>
    </section>
  )
}
