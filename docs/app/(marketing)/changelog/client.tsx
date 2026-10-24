'use client'

import type { ReactNode } from 'react'
import type { ChangelogTag } from './tags'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { CHANGELOG_TAGS, tagClass } from './tags'

export interface ChangelogEntry {
  version: string
  tags: string[]
  /** lower-cased plain text of the version + notes, built on the server (page.tsx) */
  searchText: string
  /** the rendered <article>, built on the server */
  node: ReactNode
}

// Entries shown up front, then how many more each time the sentinel comes into view
const FIRST_PAGE = 10
const PAGE_STEP = 5
// Where the timeline's head sits, as a fraction of the viewport's height: mid-screen
const READ_LINE = 0.5
// How much of the remaining distance the head covers per frame - it chases the scroll rather than
// being pinned to it. Deliberately a plain follow: magnetic nodes were tried and made the head
// stall and then lurch out of step with the scroll.
const CHASE = 0.16
// How far the head travels from the first release before its trail reaches full strength - so
// the trail grows in as you start scrolling instead of appearing at once
const TRAIL_RAMP = 160
// The trail's length behind the head (it fades out over all of it); matches .changelog-rail__trail
const TRAIL = 520
// The head's diameter; matches .changelog-head
const HEAD_SIZE = 9

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The changelog's filter chips, search and timeline over the server-rendered entries.
 *
 * Every entry is in the static HTML (search engines index the whole history from this one page),
 * so nothing is hidden until after hydration: `mounted` flips once on the client, and only then do
 * paging, filters and search start hiding entries.
 *
 * The timeline is a rail down the left with a node per release. A bright head rides the rail at
 * the middle of the screen and chases the scroll, trailing a fading stretch of the site's muted rainbow -
 * the same "where you are" trace as the /docs and /blog TOC. The effect below positions it; the
 * look is in globals.css (.changelog-timeline).
 */
export default function ChangelogClient({ entries }: { entries: ChangelogEntry[] }) {
  const [mounted, setMounted] = useState(false)
  // the chips' selection; empty is "All"
  const [tags, setTags] = useState<ChangelogTag[]>([])
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(FIRST_PAGE)
  const listRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const pendingScroll = useRef<string | null>(null)

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    // A release matches when it has every selected kind of change: "Fixed" shows every release
    // with fixes, and each extra chip narrows that ("Fixed" + "New": releases with both). Not an
    // exact match on the set - most releases mix kinds, so "Fixed" alone then hid 49 of the 64
    // releases with fixes, just because they also improved something.
    const tagsMatch = (entryTags: string[]) => tags.every(t => entryTags.includes(t))
    return entries.filter(e => tagsMatch(e.tags) && words.every(w => e.searchText.includes(w)))
  }, [entries, tags, query])

  // version -> whether it's on screen (matching, and within the loaded page)
  const shown = useMemo(
    () => new Set(matches.slice(0, visibleCount).map(e => e.version)),
    [matches, visibleCount],
  )
  const filtering = tags.length > 0 || query.trim() !== ''

  // A `#version` link (the RSS feed's, or a shared one) to a release past the first page: load far
  // enough to include it, then scroll to it once it's rendered - the browser's own jump happened
  // before hydration, while it was still in the DOM.
  useEffect(() => {
    setMounted(true)
    const target = decodeURIComponent(window.location.hash.slice(1))
    const index = entries.findIndex(e => e.version === target)
    if (index === -1) return
    if (index >= FIRST_PAGE) setVisibleCount(index + 1)
    pendingScroll.current = target
  }, [entries])

  useEffect(() => {
    if (!mounted || !pendingScroll.current) return
    document.getElementById(pendingScroll.current)?.scrollIntoView({ block: 'start' })
    pendingScroll.current = null
  }, [mounted, visibleCount])

  // Load more as the end of the list comes into view
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!mounted || !sentinel || visibleCount >= matches.length) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount(c => Math.min(c + PAGE_STEP, matches.length))
      },
      { rootMargin: '400px' },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [mounted, visibleCount, matches.length])

  // The timeline head: chases the reading line between the first and last visible release's
  // nodes, and marks the release it's on. Starts only once `mounted` has applied paging: before
  // that the list is all 117 entries, and a restored scroll position would draw the trail against
  // a list about to shrink under it.
  useEffect(() => {
    const list = listRef.current
    const trail = trailRef.current
    const headEl = headRef.current
    if (!mounted || !list || !trail || !headEl) return
    let head = -1
    let frame = 0
    let snap = true
    let current: Element | null = null
    const px = (name: string, value: number) =>
      list.style.setProperty(name, `${value.toFixed(1)}px`)

    const step = () => {
      frame = 0
      const rect = list.getBoundingClientRect()
      const nodes = [...list.querySelectorAll<HTMLElement>('.changelog-entry__node')].filter(
        n => n.offsetParent !== null,
      )
      if (nodes.length === 0) return
      const center = (n: HTMLElement) => {
        const r = n.getBoundingClientRect()
        return r.top + r.height / 2 - rect.top
      }
      const centers = nodes.map(center)
      const start = centers[0]
      const end = centers[centers.length - 1]
      const target = Math.min(Math.max(window.innerHeight * READ_LINE - rect.top, start), end)

      // a filter, search or the first frame moves the list under the head: jump, don't sweep
      head =
        snap || head < 0 || prefersReducedMotion() || Math.abs(target - head) < 0.5
          ? target
          : head + (target - head) * CHASE
      snap = false
      px('--cl-start', start)
      px('--cl-end', end)
      // The trail and head are moved with their own inline transform/background-position, not
      // through a var used inside a mask: Chrome didn't repaint a mask when only an inherited var
      // in it changed, so the trail stayed at its first (zero) length until something else forced
      // a repaint - then popped in. The trail is a fixed-length strip with a fixed fade, slid
      // along the rail (which clips it at the first node); the rail's colours are fixed to the
      // list's coordinates through background-position, so neither changes colour as it moves.
      const trailTop = head - start - TRAIL
      trail.style.transform = `translateY(${trailTop.toFixed(1)}px)`
      trail.style.backgroundPositionY = `${(-(head - TRAIL)).toFixed(1)}px`
      trail.style.opacity = Math.min(1, (head - start) / TRAIL_RAMP).toFixed(3)
      headEl.style.transform = `translate(-50%, ${(head - HEAD_SIZE / 2).toFixed(1)}px)`
      headEl.style.backgroundPositionY = `${(HEAD_SIZE / 2 - head).toFixed(1)}px`
      list.setAttribute('data-ready', '')

      // the last release whose node the head has reached
      let reached: HTMLElement | null = null
      for (const [i, node] of nodes.entries()) {
        if (centers[i] <= head + 1) reached = node
        else break
      }
      const next = reached?.closest('.changelog-entry') ?? null
      if (next !== current) {
        current?.removeAttribute('data-current')
        next?.setAttribute('data-current', '')
        current = next
      }

      if (head !== target) frame = requestAnimationFrame(step)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // paging, filters and search resize the list
    const ro = new ResizeObserver(() => {
      snap = true
      schedule()
    })
    ro.observe(list)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
      current?.removeAttribute('data-current')
      list.removeAttribute('data-ready')
    }
  }, [mounted])

  // a chip toggles its tag in or out of the selection; "All" (null) clears it
  const toggle = (t: ChangelogTag | null) => {
    setTags(current =>
      t === null ? [] : current.includes(t) ? current.filter(x => x !== t) : [...current, t],
    )
    setVisibleCount(FIRST_PAGE)
  }

  const clear = () => {
    setTags([])
    setQuery('')
    setVisibleCount(FIRST_PAGE)
  }

  return (
    <>
      <div className='changelog-controls'>
        <div role='group' aria-label='Filter releases by type' className='flex flex-wrap gap-2'>
          <button
            type='button'
            aria-pressed={tags.length === 0}
            onClick={() => toggle(null)}
            className='changelog-chip'
          >
            All
          </button>
          {CHANGELOG_TAGS.map(t => (
            <button
              key={t}
              type='button'
              aria-pressed={tags.includes(t)}
              onClick={() => toggle(t)}
              className={`changelog-chip ${tagClass(t)}`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className='changelog-search'>
          <FiSearch className='w-4 h-4 shrink-0' aria-hidden='true' />
          <input
            type='search'
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setVisibleCount(FIRST_PAGE)
            }}
            ref={searchRef}
            placeholder='Search releases'
            aria-label='Search releases'
            className='changelog-search__input'
          />
          {query && (
            <button
              type='button'
              onClick={() => {
                setQuery('')
                setVisibleCount(FIRST_PAGE)
                // back to the box, ready for the next search
                searchRef.current?.focus()
              }}
              aria-label='Clear search'
              className='changelog-search__clear'
            >
              <FiX className='w-4 h-4' aria-hidden='true' />
            </button>
          )}
        </label>
      </div>

      {/* announced on change, so a screen reader hears what a filter or search did */}
      <p className='changelog-count' aria-live='polite'>
        {mounted && filtering
          ? `${matches.length} ${matches.length === 1 ? 'release' : 'releases'}`
          : ''}
      </p>

      <div ref={listRef} className='changelog-timeline'>
        <div className='changelog-rail' aria-hidden='true'>
          <div ref={trailRef} className='changelog-rail__trail' />
        </div>
        {/* outside the rail, which clips the trail - its glow would be cut at the first node */}
        <div ref={headRef} className='changelog-head' aria-hidden='true' />

        {entries.map(e => (
          <div key={e.version} hidden={mounted && !shown.has(e.version)}>
            {e.node}
          </div>
        ))}
      </div>

      {mounted && matches.length === 0 && (
        <div className='text-center py-16'>
          <p className='text-text-muted text-lg'>No releases match that.</p>
          <button type='button' onClick={clear} className='btn-ghost mt-6 rounded-full px-5 py-2.5'>
            <FiX className='h-4 w-4' aria-hidden='true' />
            Clear filters
          </button>
        </div>
      )}

      {mounted && visibleCount < matches.length && (
        <div ref={sentinelRef} className='h-px w-full' aria-hidden='true' />
      )}
    </>
  )
}
