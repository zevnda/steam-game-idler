'use client'

import { useEffect, useState } from 'react'
import { FiDownload } from 'react-icons/fi'
import Link from 'next/link'
import { FadeIn } from '@/app/lib/animations'
import { formatBytes } from '@/app/lib/format'
import { useGlobalStore } from '@/app/lib/globalStore'

interface GithubAsset {
  name: string
  size: number
  browser_download_url: string
}

interface GithubRelease {
  tag_name: string
  published_at: string
  draft: boolean
  prerelease: boolean
  assets: GithubAsset[]
}

interface ReleaseRow {
  version: string
  date: string
  windows: { sizeLabel: string | null; url: string | null }
  // Every release before Linux support shipped has no .deb asset at all - `url: null` correctly
  // renders as "Unavailable" for those without needing to know which version Linux support
  // actually landed in.
  linux: { sizeLabel: string | null; url: string | null }
}

export default function PreviousVersionsSection() {
  const [releases, setReleases] = useState<ReleaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const selectedOS = useGlobalStore(state => state.selectedOS)

  useEffect(() => {
    let active = true

    fetch('https://api.github.com/repos/zevnda/steam-game-idler/releases?per_page=15')
      .then(response => response.json())
      .then((data: GithubRelease[]) => {
        if (!active || !Array.isArray(data)) return

        const rows = data
          .filter(release => !release.draft && !release.prerelease)
          // skip the newest release — it's already featured above
          .slice(1, 11)
          .map(release => {
            const portable = release.assets?.find(asset => asset.name.endsWith('_x64-portable.zip'))
            const deb = release.assets?.find(asset => asset.name.endsWith('.deb'))
            return {
              version: release.tag_name,
              date: new Date(release.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
              windows: {
                sizeLabel: portable ? formatBytes(portable.size) : null,
                url: portable?.browser_download_url ?? null,
              },
              linux: {
                sizeLabel: deb ? formatBytes(deb.size) : null,
                url: deb?.browser_download_url ?? null,
              },
            }
          })

        setReleases(rows)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const isLinux = selectedOS === 'linux'

  return (
    <section className='py-20 sm:py-24 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-2xl'>
        <FadeIn className='text-center mb-12'>
          <h2 className='text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-tight'>
            Need an <span className='gradient-text'>older version?</span>
          </h2>
          <p className='text-text-muted leading-relaxed'>
            {isLinux ? '.deb' : 'Portable .zip'} downloads of past releases, kept around for
            compatibility. They no longer receive bug fixes or security updates, and won&apos;t
            automatically update.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className='card'>
          {loading ? (
            <div className='p-6 text-center text-sm text-text-muted'>
              Loading previous versions…
            </div>
          ) : releases.length === 0 ? (
            <div className='p-6 text-center text-sm text-text-muted'>
              No previous versions found.
            </div>
          ) : (
            releases.map((release, i) => {
              const asset = isLinux ? release.linux : release.windows
              return (
                <div
                  key={release.version}
                  className='flex items-center justify-between gap-4 p-4 sm:p-5'
                  style={i > 0 ? { borderTop: '1px solid var(--color-border)' } : undefined}
                >
                  <div>
                    <div className='font-mono font-semibold text-text-primary'>
                      v{release.version}
                    </div>
                    <div className='text-xs text-text-muted mt-0.5'>
                      {release.date}
                      {asset.sizeLabel ? ` · ${asset.sizeLabel}` : ''}
                    </div>
                  </div>
                  {asset.url ? (
                    <Link
                      prefetch={false}
                      href={asset.url}
                      className='btn-ghost text-xs px-3 py-2 shrink-0'
                    >
                      <FiDownload className='w-3.5 h-3.5' />
                      {isLinux ? '.deb' : 'Portable .zip'}
                    </Link>
                  ) : (
                    <span className='text-xs text-text-muted/50 shrink-0'>Unavailable</span>
                  )}
                </div>
              )
            })
          )}
        </FadeIn>
      </div>
    </section>
  )
}
