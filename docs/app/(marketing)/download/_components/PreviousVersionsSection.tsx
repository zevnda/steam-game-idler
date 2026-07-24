'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiDownload } from 'react-icons/fi'
import Link from 'next/link'
import { FadeIn } from '@/app/lib/animations'
import { formatBytes } from '@/app/lib/format'
import { useGlobalStore } from '@/app/lib/globalStore'

const REPO = 'zevnda/steam-game-idler'
const TAGS_PAGE_SIZE = 100
const RELEASES_PAGE_SIZE = 100
const INITIAL_COUNT = 10
const LOAD_MORE_COUNT = 10

// Matches "1.2.3" or "v1.2.3" - filters out non-release tags (e.g. "linux-preview")
const SEMVER_RE = /^v?(\d+)\.(\d+)\.\d+$/

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

interface GithubTag {
  name: string
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

interface GroupState {
  items: ReleaseRow[]
  nextPage: number
  exhausted: boolean
  loading: boolean
}

function parseMajorMinor(tagName: string) {
  const match = SEMVER_RE.exec(tagName)
  if (!match) return null
  return `${match[1]}.${match[2]}`
}

function compareGroupsDesc(a: string, b: string) {
  const [aMajor, aMinor] = a.split('.').map(Number)
  const [bMajor, bMinor] = b.split('.').map(Number)
  if (aMajor !== bMajor) return bMajor - aMajor
  return bMinor - aMinor
}

function toReleaseRow(release: GithubRelease) {
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
}

// Fetches release pages (newest first) starting at `startPage`, collecting every non-draft,
// non-prerelease release belonging to `group` (a "major.minor" string) until `targetCount` items
// are found or the release history runs out. Release history is chronological and version families
// never interleave (a new minor never gets a release after a newer one has started), so once a
// release from a *different* group shows up after we've already matched `group`, every remaining
// release is older still - safe to stop right there instead of paging through the rest of history.
async function fetchGroupPage(
  group: string,
  startItems: ReleaseRow[],
  startPage: number,
  targetCount: number,
) {
  const items = [...startItems]
  let page = startPage
  let exhausted = false
  let enteredGroup = items.length > 0

  while (items.length < targetCount) {
    let data: GithubRelease[]
    try {
      const response = await fetch(
        `https://api.github.com/repos/${REPO}/releases?per_page=${RELEASES_PAGE_SIZE}&page=${page}`,
      )
      data = await response.json()
    } catch {
      exhausted = true
      break
    }
    if (!Array.isArray(data) || data.length === 0) {
      exhausted = true
      break
    }

    let passedGroup = false
    for (const release of data) {
      if (release.draft || release.prerelease) continue
      const releaseGroup = parseMajorMinor(release.tag_name)
      if (releaseGroup === group) {
        enteredGroup = true
        items.push(toReleaseRow(release))
      } else if (enteredGroup) {
        passedGroup = true
        break
      }
    }

    page += 1
    if (passedGroup || data.length < RELEASES_PAGE_SIZE) {
      exhausted = true
      break
    }
  }

  return { items, nextPage: page, exhausted, loading: false }
}

export default function PreviousVersionsSection() {
  const [groups, setGroups] = useState<string[] | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [groupData, setGroupData] = useState<Record<string, GroupState>>({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const selectedOS = useGlobalStore(state => state.selectedOS)
  // Tracks which groups already have a fetch started/completed, independent of groupData's state
  // updates, so re-selecting a previously viewed group re-renders from cache instead of refetching.
  const startedGroupsRef = useRef<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Builds the version-family dropdown from GitHub's tags endpoint rather than the releases
  // endpoint - tags carry no per-release asset payload, so listing every version family this repo
  // has ever shipped costs a few hundred KB here instead of several MB from the releases endpoint.
  useEffect(() => {
    let active = true

    async function loadGroups() {
      const found = new Set<string>()
      for (let page = 1; ; page++) {
        const response = await fetch(
          `https://api.github.com/repos/${REPO}/tags?per_page=${TAGS_PAGE_SIZE}&page=${page}`,
        )
        const data: GithubTag[] = await response.json()
        if (!Array.isArray(data) || data.length === 0) break
        for (const tag of data) {
          const group = parseMajorMinor(tag.name)
          if (group) found.add(group)
        }
        if (data.length < TAGS_PAGE_SIZE) break
      }
      if (!active || found.size === 0) return
      const sorted = Array.from(found).sort(compareGroupsDesc)
      setGroups(sorted)
      setSelectedGroup(sorted[0])
    }

    loadGroups().catch(() => {
      if (active) setGroups([])
    })

    return () => {
      active = false
    }
  }, [])

  const loadGroupPage = useCallback(
    (group: string, startItems: ReleaseRow[], startPage: number, targetCount: number) => {
      setGroupData(prev => ({
        ...prev,
        [group]: { items: startItems, nextPage: startPage, exhausted: false, loading: true },
      }))
      fetchGroupPage(group, startItems, startPage, targetCount).then(result => {
        setGroupData(prev => ({ ...prev, [group]: result }))
      })
    },
    [],
  )

  useEffect(() => {
    if (!selectedGroup || startedGroupsRef.current.has(selectedGroup)) return
    startedGroupsRef.current.add(selectedGroup)
    loadGroupPage(selectedGroup, [], 1, INITIAL_COUNT)
  }, [selectedGroup, loadGroupPage])

  // Native <select> popups can't have their height capped via CSS in Chrome/Safari (no standard
  // API for it), so the version picker is a custom button + listbox instead, closed on an outside
  // click or Escape like any other popover.
  useEffect(() => {
    if (!isDropdownOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsDropdownOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  const isLinux = selectedOS === 'linux'
  const currentGroupState = selectedGroup ? groupData[selectedGroup] : undefined

  return (
    <section className='py-20 sm:py-24 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-2xl'>
        <FadeIn className='text-center mb-12'>
          <h2 className='text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-tight'>
            Need an <span className='gradient-text'>older version?</span>
          </h2>
          <p className='text-text-muted leading-relaxed'>
            {isLinux ? '.deb ' : 'Portable .zip '} downloads of past releases, kept around for
            compatibility. They no longer receive bug fixes or security updates, and won&apos;t
            automatically update.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className='flex items-center justify-center gap-3 mb-4'>
            <span className='text-sm text-text-muted'>Version</span>
            <div ref={dropdownRef} className='relative'>
              <button
                type='button'
                disabled={!groups || groups.length === 0}
                onClick={() => setIsDropdownOpen(prev => !prev)}
                aria-haspopup='listbox'
                aria-expanded={isDropdownOpen}
                className='inline-flex items-center gap-2 bg-white/5 border border-white/15 text-text-primary text-sm rounded-lg px-3 py-2 hover:border-white/25 transition-colors duration-150 disabled:opacity-60 disabled:cursor-default cursor-pointer'
              >
                {selectedGroup ? `${selectedGroup}.x` : 'Loading…'}
                <FiChevronDown
                  className={`w-3.5 h-3.5 text-text-muted transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen && groups && groups.length > 0 && (
                <div
                  role='listbox'
                  className='absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-32 max-h-48 overflow-y-auto rounded-lg border border-white/15 bg-surface-raised py-1 shadow-lg'
                >
                  {groups.map(group => (
                    <button
                      key={group}
                      type='button'
                      role='option'
                      aria-selected={group === selectedGroup}
                      onClick={() => {
                        setSelectedGroup(group)
                        setIsDropdownOpen(false)
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-sm transition-colors duration-150 cursor-pointer ${
                        group === selectedGroup
                          ? 'text-text-primary bg-white/10'
                          : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                      }`}
                    >
                      {group}.x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='card'>
            {!currentGroupState ||
            (currentGroupState.loading && currentGroupState.items.length === 0) ? (
              <div className='p-6 text-center text-sm text-text-muted'>
                Loading previous versions…
              </div>
            ) : currentGroupState.items.length === 0 ? (
              <div className='p-6 text-center text-sm text-text-muted'>
                No previous versions found.
              </div>
            ) : (
              currentGroupState.items.map((release, i) => {
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
          </div>

          {currentGroupState &&
            !currentGroupState.exhausted &&
            currentGroupState.items.length > 0 && (
              <div className='flex justify-center mt-5'>
                <button
                  type='button'
                  onClick={() =>
                    loadGroupPage(
                      selectedGroup as string,
                      currentGroupState.items,
                      currentGroupState.nextPage,
                      currentGroupState.items.length + LOAD_MORE_COUNT,
                    )
                  }
                  disabled={currentGroupState.loading}
                  className='btn-ghost text-xs px-4 py-2 cursor-pointer disabled:opacity-60 disabled:cursor-default'
                >
                  {currentGroupState.loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
        </FadeIn>
      </div>
    </section>
  )
}
