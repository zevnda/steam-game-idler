'use client'

import { FaWindows } from 'react-icons/fa6'
import { FiRefreshCw } from 'react-icons/fi'
import Link from 'next/link'
import { FadeIn } from '@/app/lib/animations'
import { useGlobalStore } from '@/app/lib/globalStore'

export default function DownloadHero() {
  const { downloadUrl, latestVersion, downloadSize, totalDownloads } = useGlobalStore(
    state => state,
  )

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
            Free and open source for Windows. Farm trading cards, manage achievements, and boost
            playtime — ready in under a minute.
          </p>

          <Link
            prefetch={false}
            href={downloadUrl}
            className='btn-download justify-center'
            style={{ padding: '1.125rem 2.5rem', fontSize: '1rem' }}
          >
            <FaWindows className='w-4 h-4' />
            Download for Windows
          </Link>

          <div className='flex items-center justify-center gap-1.5 text-xs text-text-muted mt-4'>
            <FiRefreshCw className='w-3 h-3' />
            Includes automatic updates
          </div>

          <p className='text-sm text-text-muted mt-10'>
            Windows 10 / 11 &middot; {downloadSize || '~7 MB'} &middot; Elv2 License &middot;{' '}
            {totalDownloads || '100K+'} downloads
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
