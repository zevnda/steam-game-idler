'use client'

import { FaLinux, FaWindows } from 'react-icons/fa6'
import { TbArrowDown } from 'react-icons/tb'
import Link from 'next/link'
import { scrollBehavior } from '@/app/(marketing)/(home)/_components/landing/demoStore'
import { OLDER_VERSIONS_ID } from '@/app/(marketing)/download/_components/PreviousVersionsSection'
import { useGlobalStore } from '@/app/lib/globalStore'
import { useSwapKey } from '@/app/lib/useSwapKey'

// The home page hero's flat snapshot of the mock app (see docs/CLAUDE.md, 'Hero placeholder'):
// the real UI, but filled with the landing page's fictional games - never real capsule art, which
// is third-party branding. Regenerated along with the home hero whenever the mock changes.
const SCREENSHOT = '/landing/sgi-mock-hero.webp'

const LATEST_RELEASE = 'https://github.com/zevnda/steam-game-idler/releases/latest'

// The home hero's secondary-button look (ShowcaseHero.tsx's "Try the live demo")
const secondaryLinkClass = 'btn-ghost px-4 py-2 text-sm rounded-full'

export default function DownloadHero() {
  const {
    downloadUrl,
    latestVersion,
    downloadSize,
    totalDownloads,
    linuxDownloadUrl,
    linuxDownloadSize,
    linuxRpmUrl,
    linuxAppImageUrl,
    windowsPortableUrl,
    selectedOS,
    overrideOS,
  } = useGlobalStore(state => state)

  // A Linux release only actually exists once the CI pipeline has published one - fall back to
  // Windows regardless of detection/a prior manual override until then, so this page never
  // offers a dead link. Resolves itself automatically the moment a real Linux release ships, no
  // redeploy needed (see StoreLoader.tsx).
  const linuxAvailable = Boolean(linuxDownloadUrl)
  const isLinux = selectedOS === 'linux' && linuxAvailable
  const primaryUrl = isLinux ? linuxDownloadUrl : downloadUrl
  const primarySize = (isLinux ? linuxDownloadSize : downloadSize) || '~7 MB'
  const hasVersion = Boolean(latestVersion) && latestVersion !== '0.0.0'
  // everything below that changes with the platform crossfades when it's switched
  const swap = useSwapKey(isLinux)

  const scrollToOlder = (e: React.MouseEvent) => {
    const el = document.getElementById(OLDER_VERSIONS_ID)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  }

  return (
    <section className='pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden'>
      <div className='landing-container page-enter grid gap-14 lg:gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] items-center'>
        {/* centred until the copy/screenshot split at lg - the home hero's phone layout */}
        <div className='max-w-xl mx-auto text-center lg:mx-0 lg:text-left'>
          <h1 className='gradient-text w-fit mx-auto lg:mx-0 text-[clamp(2.6rem,4.6vw,4.1rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance'>
            Download Steam Game Idler
          </h1>

          <p className='mt-6 text-lg text-text-muted leading-relaxed'>
            Farm trading cards, manage achievements and boost playtime. Free, and ready to go in
            under a minute.
          </p>

          <div className='mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-3'>
            <Link prefetch={false} href={primaryUrl} className='btn-download justify-center'>
              <span key={swap.key} className={`inline-flex items-center gap-2 ${swap.className}`}>
                {isLinux ? <FaLinux className='w-4 h-4' /> : <FaWindows className='w-4 h-4' />}
                Download for {isLinux ? 'Linux' : 'Windows'}
              </span>
            </Link>
            {/* a real #anchor link, so it still jumps there before hydration */}
            <a
              href={`#${OLDER_VERSIONS_ID}`}
              onClick={scrollToOlder}
              className='btn-ghost px-6 py-3 rounded-full'
            >
              Previous versions
              <TbArrowDown className='w-4 h-4' />
            </a>
          </div>

          <p
            key={`spec-${swap.key}`}
            className={`mt-6 text-sm text-text-muted leading-relaxed ${swap.className}`}
          >
            {/* the store starts at a '0.0.0' placeholder until StoreLoader's GitHub fetch lands */}
            {hasVersion ? (
              <Link
                prefetch={false}
                href={`https://github.com/zevnda/steam-game-idler/releases/${latestVersion}`}
                target='_blank'
                className='text-text-primary font-medium underline decoration-white/25 underline-offset-4 hover:decoration-white/70 transition-colors'
              >
                v{latestVersion}
              </Link>
            ) : (
              'Latest release'
            )}{' '}
            &middot; {isLinux ? 'Most 64-bit distros' : 'Windows 10 / 11'} &middot; {primarySize}{' '}
            &middot; {totalDownloads || '100K+'} downloads
          </p>

          {/* Always rendered, never added once the release data arrives: appearing ~1s after load,
              this row and the OS switch below grew the copy column and pushed the whole page down
              (layout shift). Until StoreLoader has the asset URLs, the links point at the latest
              release page on GitHub, where the same files are. */}
          <div
            key={`alt-${swap.key}`}
            className={`flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-6 ${swap.className}`}
          >
            {isLinux ? (
              <>
                <Link
                  prefetch={false}
                  href={linuxRpmUrl || LATEST_RELEASE}
                  className={secondaryLinkClass}
                >
                  <FaLinux className='w-3.5 h-3.5' />
                  Download .rpm
                </Link>
                <Link
                  prefetch={false}
                  href={linuxAppImageUrl || LATEST_RELEASE}
                  className={secondaryLinkClass}
                >
                  <FaLinux className='w-3.5 h-3.5' />
                  Download .AppImage
                </Link>
              </>
            ) : (
              <Link
                prefetch={false}
                href={windowsPortableUrl || LATEST_RELEASE}
                className={secondaryLinkClass}
              >
                <FaWindows className='w-3.5 h-3.5' />
                Download portable .zip
              </Link>
            )}
          </div>

          {/* Manual override - the platform above is only ever a best-effort default (client-side
              OS sniff, or a prior visit's choice), never a hard gate. Only offered once a real
              Linux build actually exists to switch to; until then it holds its space invisibly
              (`invisible` also takes it out of the tab order and the accessibility tree). */}
          <button
            type='button'
            onClick={() => overrideOS(isLinux ? 'windows' : 'linux')}
            className={`mt-6 block mx-auto lg:mx-0 text-sm text-text-muted underline underline-offset-4 hover:text-text-primary transition-colors duration-150 cursor-pointer ${linuxAvailable ? '' : 'invisible'}`}
          >
            <span key={swap.key} className={`inline-block ${swap.className}`}>
              Not on {isLinux ? 'Linux' : 'Windows'}? Get it for {isLinux ? 'Windows' : 'Linux'}
            </span>
          </button>
        </div>

        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SCREENSHOT}
            alt="Steam Game Idler's Games page, showing a Steam library with recommended games and a full games list"
            width={1600}
            height={1000}
            className='download-shot w-full h-auto block'
            loading='eager'
          />
        </div>
      </div>
    </section>
  )
}
