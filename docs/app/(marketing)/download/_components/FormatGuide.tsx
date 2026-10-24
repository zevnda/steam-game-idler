import Link from 'next/link'
import SectionHeading from '@/app/(marketing)/(home)/_components/landing/SectionHeading'
import { StaggerGroup, StaggerItem } from '@/app/lib/animations'

// Mirrors docs/_content/get-started/install.mdx (and the root CLAUDE.md's "Platform scope"): the
// installer and the AppImage update themselves; the portable .zip and .deb/.rpm don't. Keep the
// two in step if a format's update behaviour changes. `accent` is each card's glow hue, taken from
// the home bento's palette (landing/features.ts).
const FORMATS = [
  {
    os: 'Windows',
    name: 'Installer',
    accent: '#60a5fa',
    file: '.exe',
    body: 'The one most people want. Installs SGI with a desktop shortcut and keeps it up to date on its own.',
    updates: true,
  },
  {
    os: 'Windows',
    name: 'Portable',
    accent: '#c084fc',
    file: '.zip',
    body: 'Nothing to install: extract it to any folder and run it from there. Settings stay inside that folder.',
    updates: false,
  },
  {
    os: 'Linux',
    name: 'AppImage',
    accent: '#fb923c',
    file: '.AppImage',
    body: 'Runs on almost any 64-bit distro without installing. Make it executable and start it.',
    updates: true,
  },
  {
    os: 'Linux',
    name: 'Package',
    accent: '#34d399',
    file: '.deb / .rpm',
    body: 'Installs through your package manager on Debian, Ubuntu, Fedora or openSUSE based distros.',
    updates: false,
  },
]

export default function FormatGuide() {
  return (
    <section aria-labelledby='formats-heading' className='landing-section'>
      <div className='landing-container grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]'>
        <div>
          <SectionHeading
            id='formats-heading'
            align='left'
            title={
              <>
                Which file <span className='gradient-text'>do I need?</span>
              </>
            }
            sub='Every release comes in four formats. Linux supports Steam Sign-in only; Windows supports both sign-in methods.'
          />
          <div className='mt-8 flex justify-center lg:justify-start'>
            <Link
              prefetch={false}
              href='/docs/get-started/install'
              className='btn-ghost px-5 py-2.5 rounded-full'
            >
              Install guide
            </Link>
          </div>
        </div>

        <StaggerGroup className='grid gap-4 sm:grid-cols-2'>
          {FORMATS.map(f => (
            <StaggerItem key={f.name} className='h-full'>
              {/* the home page's bento surface; --accent tints its top glow, one hue per card from the
                  home bento's palette (features.ts) */}
              <article
                className='bento-tile'
                style={{ '--accent': f.accent } as React.CSSProperties}
              >
                <div className='relative flex flex-1 flex-col p-7'>
                  <p className='text-sm text-text-muted'>{f.os}</p>
                  <h3 className='mt-4 text-2xl font-semibold tracking-[-0.02em] text-text-primary'>
                    {f.name} <span className='text-text-muted font-normal'>{f.file}</span>
                  </h3>
                  <p className='mt-3 flex-1 text-base text-text-muted leading-relaxed'>{f.body}</p>
                  <p
                    className={`mt-5 text-sm font-medium ${f.updates ? 'text-emerald-300' : 'text-text-muted'}`}
                  >
                    {f.updates ? 'Updates itself' : 'Update it by hand for each release'}
                  </p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
