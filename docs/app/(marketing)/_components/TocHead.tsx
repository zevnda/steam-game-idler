'use client'

import { useEffect, useRef } from 'react'

// Our own hook on the clerk TOC's thumb wrapper (see findThumb). globals.css styles the thumb
// through this attribute, never through Fumadocs' markup, so a Fumadocs release that changes how
// it writes the range can't silently unstyle it again (16.18 did exactly that - see syncRange).
const THUMB_ATTR = 'data-toc-thumb'
// How many frames --track-bottom must hold still before the head stops following it
const SETTLE_FRAMES = 3

/**
 * The clerk TOC's thumb: the active-range SVG (the only rail SVG outside a link and outside the
 * title) and the div wrapping it. Found by structure, not by class or inline style, both of which
 * have changed between Fumadocs releases.
 */
function findThumb(root: Element) {
  for (const svg of root.querySelectorAll('svg')) {
    const parent = svg.parentElement
    if (
      parent instanceof HTMLDivElement &&
      svg.querySelector(':scope > path') &&
      !svg.closest('a, #nd-toc-title, #toc-title, .blog-toc__title')
    ) {
      return parent
    }
  }
  return null
}

// The polygon Fumadocs clips the thumb SVG to: polygon(0 TOPpx, 100% TOPpx, 100% BOTTOMpx, ...)
const RANGE = /polygon\(\s*\S+\s+(-?[\d.]+)px\s*,\s*\S+\s+-?[\d.]+px\s*,\s*\S+\s+(-?[\d.]+)px/

/**
 * Exposes the active range as --track-top/--track-bottom on the thumb wrapper, which the trail
 * mask and the head in globals.css are built on (registered with @property so they ease).
 * Fumadocs' clerk TOC used to set these vars itself; since fumadocs-ui 16.18 it only writes the
 * range into the SVG's inline clip-path, so they're derived from that here. If a future release
 * sets the vars again, the parse simply finds no polygon and leaves its values alone.
 */
function syncRange(thumb: HTMLElement) {
  if (!thumb.hasAttribute(THUMB_ATTR)) thumb.setAttribute(THUMB_ATTR, '')
  const svg = thumb.querySelector<SVGSVGElement>(':scope > svg')
  const match = svg?.style.clipPath.match(RANGE)
  if (!match) return
  // only on change: each write is a mutation the observer in TocHead wakes for again
  for (const [name, value] of [
    ['--track-top', `${match[1]}px`],
    ['--track-bottom', `${match[2]}px`],
  ]) {
    if (thumb.style.getPropertyValue(name) !== value) thumb.style.setProperty(name, value)
  }
}

/**
 * Keeps the docs/blog TOC's head - the changelog timeline's dot, drawn by globals.css as the
 * thumb wrapper's ::before/::after - on Fumadocs' rail, which bends sideways with heading depth.
 *
 * The head's height is pure CSS (it sits at --track-bottom, which eases on its own). Only its x
 * needs this: Fumadocs exposes no per-depth offset, so every frame the range is moving it reads
 * the eased --track-bottom back and finds the rail's x there, from the same per-link geometry
 * clerk.js builds its path from (a vertical run per link at its rail line's x, joined by straight
 * bends). Easing x on its own instead cut every bend's corner.
 *
 * Renders a hidden marker only, to find its TOC from: mounted as the docs TOC's `footer` and
 * inside the blog's TableOfContents.
 */
export default function TocHead() {
  const markerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = markerRef.current?.closest('#nd-toc, .blog-toc')
    if (!root) return
    let frame = 0
    let last = ''
    let still = 0

    const step = () => {
      frame = 0
      const thumb = findThumb(root)
      if (!thumb) return
      syncRange(thumb)
      const bottom = getComputedStyle(thumb).getPropertyValue('--track-bottom')
      // nothing active yet (above the first heading): no head
      if (!root.querySelector("a[data-active='true']")) {
        thumb.removeAttribute('data-head')
        last = ''
        return
      }
      const y = parseFloat(bottom)
      let x: number | null = null
      let prev: { bottom: number; x: number } | null = null
      for (const a of root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
        const line = a.querySelector(':scope > svg > line')
        if (!line) continue
        const styles = getComputedStyle(a)
        const top = a.offsetTop + parseFloat(styles.paddingTop)
        const end = a.offsetTop + a.clientHeight - parseFloat(styles.paddingBottom)
        const lx = parseFloat(line.getAttribute('x1') ?? '0')
        x = lx
        if (y < top && prev) {
          // on the bend between the previous link's run and this one's
          const t = (y - prev.bottom) / (top - prev.bottom)
          x = prev.x + (lx - prev.x) * Math.min(1, Math.max(0, t))
        }
        if (y <= end) break
        prev = { bottom: end, x: lx }
      }
      if (x === null) return
      // only on change: each write is a mutation the observer below would wake us for again
      const value = `${x.toFixed(2)}px`
      if (thumb.style.getPropertyValue('--toc-head-x') !== value) {
        thumb.style.setProperty('--toc-head-x', value)
      }
      if (!thumb.hasAttribute('data-head')) thumb.setAttribute('data-head', '')
      // Keep going while the range is still easing. A few unchanged frames, not one: the frame
      // right after Fumadocs moves the range still reads the old value, as its transition has only
      // just started.
      still = bottom === last ? still + 1 : 0
      last = bottom
      if (still < SETTLE_FRAMES) frame = requestAnimationFrame(step)
    }
    const schedule = () => {
      still = 0
      if (!frame) frame = requestAnimationFrame(step)
    }

    schedule()
    // Fumadocs moves the range by writing the thumb SVG's inline style, and marks links data-active
    const mo = new MutationObserver(schedule)
    mo.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'data-active'],
    })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      mo.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return <span ref={markerRef} hidden />
}
