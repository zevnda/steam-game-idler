'use client'

import { FaLinux, FaWindows } from 'react-icons/fa6'
import { FiRefreshCw } from 'react-icons/fi'
import Link from 'next/link'
import { FadeIn } from '@/app/lib/animations'
import { useGlobalStore } from '@/app/lib/globalStore'

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

  return (
    <section className='pt-36 pb-24 sm:pt-44 sm:pb-28 relative overflow-hidden'>
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,163,255,0.16) 0%, transparent 70%)',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        }}
      />

      <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
        <FadeIn immediate className='max-w-2xl mx-auto text-center'>
          <Link
            prefetch={false}
            href={`https://github.com/zevnda/steam-game-idler/releases/${latestVersion}`}
            target='_blank'
            className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-sm text-text-muted hover:text-text-primary hover:border-white/25 transition-colors duration-150 mb-7'
          >
            <span className='w-1.5 h-1.5 bg-accent rounded-full animate-pulse' />v{latestVersion}{' '}
            &middot; Latest release
          </Link>

          <h1 className='text-5xl sm:text-6xl md:text-7xl font-bold leading-none tracking-tight mb-6'>
            <span className='text-text-primary'>Download</span>{' '}
            <span className='block gradient-text'>Steam Game Idler</span>
          </h1>

          <p className='text-lg text-text-muted leading-relaxed mb-10'>
            Farm trading cards, manage achievements, and boost playtime — ready to go in under a
            minute.
          </p>

          <Link
            prefetch={false}
            href={primaryUrl}
            className='btn-download justify-center'
            style={{ padding: '1.125rem 2.5rem', fontSize: '1rem' }}
          >
            {isLinux ? <FaLinux className='w-4 h-4' /> : <FaWindows className='w-4 h-4' />}
            Download for {isLinux ? 'Linux' : 'Windows'}
          </Link>

          <div className='flex items-center justify-center gap-1.5 text-xs text-text-muted mt-4'>
            <FiRefreshCw className='w-3 h-3' />
            Includes automatic updates
          </div>

          <p className='text-sm text-text-muted mt-10'>
            {isLinux ? '.deb &middot; most 64-bit distros' : 'Windows 10 / 11'} &middot;{' '}
            {primarySize} &middot; Elastic-2.0 License &middot; {totalDownloads || '100K+'}{' '}
            downloads
          </p>

          {isLinux && (linuxRpmUrl || linuxAppImageUrl) && (
            <p className='text-xs text-text-muted mt-3'>
              On Fedora/openSUSE or another distro?{' '}
              {linuxRpmUrl && (
                <Link
                  prefetch={false}
                  href={linuxRpmUrl}
                  className='underline hover:text-text-primary'
                >
                  .rpm
                </Link>
              )}
              {linuxRpmUrl && linuxAppImageUrl && ' · '}
              {linuxAppImageUrl && (
                <Link
                  prefetch={false}
                  href={linuxAppImageUrl}
                  className='underline hover:text-text-primary'
                >
                  AppImage
                </Link>
              )}
            </p>
          )}

          {/* Manual override - the platform above is only ever a best-effort default (client-side
              OS sniff, or a prior visit's choice), never a hard gate. Only offered once a real
              Linux build actually exists to switch to. */}
          {linuxAvailable && (
            <button
              type='button'
              onClick={() => overrideOS(isLinux ? 'windows' : 'linux')}
              className='mt-6 text-xs text-text-muted underline hover:text-text-primary transition-colors duration-150'
            >
              Not on {isLinux ? 'Linux' : 'Windows'}? Get it for {isLinux ? 'Windows' : 'Linux'}
            </button>
          )}
        </FadeIn>
      </div>
    </section>
  )
}
