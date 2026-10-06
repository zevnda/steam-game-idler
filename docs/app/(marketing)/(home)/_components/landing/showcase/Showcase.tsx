'use client'

import type { Feature } from '../features'
import type { StageHandle } from './engine/stage'
import type { Frame, PageId, Pose } from './engine/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { registerPlaygroundTop, useDemoStore } from '../demoStore'
import { featureById, featureForPage } from '../features'
import { VIEW_DAMPING } from './engine/types'
import FallbackShot from './FallbackShot'
import Playground from './Playground'
import ShowcaseHero from './ShowcaseHero'
import { Inter, Unbounded } from 'next/font/google'

// The desktop app's own faces, so the mock's text renders like the real UI. Not preloaded: they're
// only needed once the lazily-loaded 3D stage draws, and shouldn't compete with first paint.
const inter = Inter({ subsets: ['latin'], preload: false, variable: '--font-mock-sans' })
const unbounded = Unbounded({ subsets: ['latin'], preload: false, variable: '--font-mock-display' })

/** Below this width (or in portrait) the playground stacks: window on top, picker underneath. */
const STACKED_QUERY = '(max-width: 1023px), (max-aspect-ratio: 1/1)'
/** Scroll distance (in viewport heights) over which the hero hands over to the playground. */
const TRANSITION = 0.9
/**
 * Stacked screens (phones, portrait tablets) get the mock's compact layout - a 560x960 portrait
 * window (see engine/mockApp.ts mockLayout) - shown whole; wide screens get the 1440x900 one.
 */
const COMPACT = { w: 560, h: 960 }
const WIDE = { w: 1440, h: 900 }
/** Room under the docked compact window for the feature picker. */
const STACKED_PANEL_H = 262

/** The hero framing: the whole window leaning back beneath the headline, like it's rising. */
function heroPose(compact: boolean) {
  const pose: Pose = {
    focus: compact ? [COMPACT.w / 2, COMPACT.h / 2] : [WIDE.w / 2, WIDE.h / 2],
    zoom: 1,
    rx: -24,
    ry: 0,
  }
  return pose
}

type StageState = 'loading' | 'ready' | 'failed'

/** Resolves after the window's load event, at the browser's next idle moment (2.5s at most). */
function afterLoadAndIdle() {
  return new Promise<void>(resolve => {
    const idle = () =>
      typeof window.requestIdleCallback === 'function' // missing in older Safari
        ? window.requestIdleCallback(() => resolve(), { timeout: 2500 })
        : setTimeout(resolve, 200)
    if (document.readyState === 'complete') idle()
    else window.addEventListener('load', idle, { once: true })
  })
}

/**
 * The floating dust before the 3D stage (which has its own) takes over: one 1px element whose
 * box-shadows are ~70 motes, placed deterministically so server and client render the same.
 */
const DUST_PLACEHOLDER = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin((i + 1) * 127.1 + n * 311.7) * 43758.5453
    return x - Math.floor(x)
  }
  // the element is 1px; a few motes get a half-pixel spread, like the stage's occasional larger one
  const big = r(4) > 0.86 ? 0.5 : 0
  return `${(r(1) * 100).toFixed(2)}vw ${(r(2) * 100).toFixed(2)}svh 0 ${big}px rgba(255,255,255,${(0.08 + r(3) * 0.27).toFixed(2)})`
}).join(',')

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * The hero -> playground hand-over, as windows of the (damped) scroll progress `t`. The headline
 * is the thread through it: it travels into the playground's heading slot over the same long
 * stretch the window takes to rise and dock (the window: t 0.22 -> 1, smoothstep), so the two
 * move as one, and then simply stays there as the playground's heading - no swap at the end for
 * the eye to trip over. The picker's intro and rows build in beneath it as it lands
 * (Playground.tsx's WIDE_AT). Nothing else needs these - the supporting copy and the
 * playground's build-out are CSS on `--t`.
 */
const HAND_OVER = {
  travel: [0.16, 0.86],
  /** phones / reduced motion: the headline lifts (or just fades) away in place instead */
  fade: [0.2, 0.45],
}
const windowOf = (t: number, [a, b]: number[]) => clamp01((t - a) / (b - a))
function lerpFrame(a: Frame, b: Frame, t: number) {
  const f: Frame = {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    w: lerp(a.w, b.w, t),
    h: lerp(a.h, b.h, t),
  }
  return f
}
function lerpPose(a: Pose, b: Pose, t: number) {
  const p: Pose = {
    focus: [lerp(a.focus[0], b.focus[0], t), lerp(a.focus[1], b.focus[1], t)],
    zoom: lerp(a.zoom, b.zoom, t),
    rx: lerp(a.rx, b.rx, t),
    ry: lerp(a.ry, b.ry, t),
  }
  return p
}

/** Where the window docks once the playground takes over, and where the picker panel goes. */
function playLayout(w: number, h: number, stacked: boolean) {
  if (stacked) {
    // The compact window, whole: as large as fits between the nav and the picker underneath,
    // centred; the picker sits directly below it.
    const availH = h - 76 - STACKED_PANEL_H
    const fw = Math.min(w - 32, (availH * COMPACT.w) / COMPACT.h)
    const fh = (fw * COMPACT.h) / COMPACT.w
    const frame = { x: (w - fw) / 2, y: 76, w: fw, h: fh }
    const panelW = Math.min(w - 32, Math.max(fw, 520))
    return { frame, panel: { left: (w - panelW) / 2, width: panelW, top: 76 + fh + 16 } }
  }
  const gutter = Math.max(32, (w - 1480) / 2 + 32)
  const panelW = Math.min(380, Math.max(300, w * 0.24))
  const x0 = gutter + panelW + 56
  const availW = w - x0 - gutter
  // generous bottom room so the window's rim glow fades out before the stage's bottom edge
  const availH = h - 72 - 120
  const fw = Math.min(availW, availH / 0.625)
  const fh = fw * 0.625
  const frame = { x: x0 + (availW - fw) / 2, y: 72 + 24 + (availH - fh) / 2, w: fw, h: fh }
  return { frame, panel: { left: gutter, width: panelW, top: -1 } }
}

/**
 * The landing page's opening act. A pinned three.js stage shows a live, clickable 3D replica of
 * the app: first leaning back beneath the hero headline, then - as you scroll - rising, turning to
 * face you and docking beside a feature picker ("the playground"). Picking a feature drives the
 * app; navigating inside the app updates the picker.
 */
export default function Showcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const heroTextRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelHeadingRef = useRef<HTMLDivElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<StageHandle | null>(null)
  const progressRef = useRef(0)
  /**
   * The overlays' own clock: `shown` eases toward the scroll position (`target`) at the stage's
   * rate (VIEW_DAMPING), one rAF loop that stops itself once caught up. `layout` is what apply()
   * last measured for drawing them.
   */
  const overlayRef = useRef({
    target: 0,
    shown: 0,
    primed: false,
    raf: 0,
    last: 0,
    reduce: false,
    layout: { stacked: false, vh: 0, panelLeft: 0 },
  })
  const featureRef = useRef<Feature>(featureById(useDemoStore.getState().feature))

  const [stageState, setStageState] = useState<StageState>('loading')
  const [stacked, setStacked] = useState(false)
  const [docked, setDocked] = useState(false)
  /** scrolled all the way through the rise - the window is in its docked position */
  const [inPlace, setInPlace] = useState(false)
  const [panelPos, setPanelPos] = useState({ left: 32, width: 340, top: -1 })

  const featureId = useDemoStore(s => s.feature)
  const source = useDemoStore(s => s.source)

  // ---- the HTML overlays at (damped) progress `t`: the `--t` every CSS rule reads, plus the
  // headline, which needs measured positions. Layout offsets, not getBoundingClientRect: they
  // ignore the transform written here, so the resting position never drifts.
  const drawOverlay = useCallback((t: number) => {
    const sticky = stickyRef.current
    if (!sticky) return
    sticky.style.setProperty('--t', t.toFixed(4))
    const { reduce, layout } = overlayRef.current
    const hero = heroRef.current
    const head = headlineRef.current
    if (!head || !hero) return
    const panel = panelRef.current
    const slot = panelHeadingRef.current
    const lines = head.querySelectorAll<HTMLElement>(':scope > .hero-headline__line')
    if (layout.stacked || reduce || !panel || !slot) {
      lines.forEach(line => (line.style.transform = ''))
      // Phones (no side panel to travel into - the picker sits under the window) and reduced
      // motion (no travel, no blur): the headline steps back in place.
      const p = windowOf(t, HAND_OVER.fade)
      head.style.transform = reduce || !p ? '' : `translateY(${-28 * smooth(p)}px)`
      head.style.filter = reduce || !p ? '' : `blur(${(p * 6).toFixed(2)}px)`
      head.style.opacity = p ? (1 - p).toFixed(3) : ''
      return
    }
    const fromX = hero.offsetLeft + head.offsetLeft
    const fromY = hero.offsetTop + head.offsetTop
    // .playground is centred on calc(50% + 34px) by a translateY(-50%), and positioned from
    // play.panel (React applies that a render later - use the measured source of truth)
    const toX = layout.panelLeft + slot.offsetLeft
    const toY = layout.vh / 2 + 34 - panel.offsetHeight / 2 + slot.offsetTop
    const scale =
      parseFloat(getComputedStyle(slot).fontSize) / parseFloat(getComputedStyle(head).fontSize)
    const k = smooth(windowOf(t, HAND_OVER.travel))
    head.style.transform = k
      ? `translate(${((toX - fromX) * k).toFixed(1)}px, ${((toY - fromY) * k).toFixed(1)}px) scale(${lerp(1, scale, k).toFixed(4)})`
      : ''
    head.style.filter = ''
    head.style.opacity = ''
    // The hero centres each line in the headline's box; the playground heading is left-aligned.
    // Slide each line from centred to flush-left along the same curve (offsets are in the
    // headline's own unscaled px - the scale above applies on top).
    const box = head.offsetWidth
    lines.forEach(line => {
      const shift = ((box - line.offsetWidth) / 2) * k
      line.style.transform = shift ? `translateX(${(-shift).toFixed(1)}px)` : ''
    })
  }, [])

  // ---- one frame of the overlays' follow (threejs-animation's "smooth damping", at the stage's
  // own rate): stepped wheel scrolling glides instead of jumping a notch at a time
  const followScroll = useCallback(
    (now: number) => {
      const o = overlayRef.current
      const dt = Math.min(0.05, (now - o.last) / 1000)
      o.last = now
      const rate = o.reduce ? VIEW_DAMPING.reduced : VIEW_DAMPING.normal
      o.shown += (o.target - o.shown) * (1 - Math.exp(-dt * rate))
      if (Math.abs(o.target - o.shown) < 0.0004) o.shown = o.target
      drawOverlay(o.shown)
      o.raf = o.shown === o.target ? 0 : requestAnimationFrame(followScroll)
    },
    [drawOverlay],
  )

  // ---- the one place that turns scroll progress + layout into stage view and overlay styles
  const apply = useCallback(() => {
    const sticky = stickyRef.current
    const section = sectionRef.current
    if (!sticky || !section) return
    const vw = sticky.clientWidth
    const vh = sticky.clientHeight
    const isStacked = window.matchMedia(STACKED_QUERY).matches
    const t = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / (vh * TRANSITION)))
    progressRef.current = t
    // the window holds below the headline until the supporting copy has mostly stepped back
    // (CSS, .hero-recede, t 0..~0.36), then rises
    const e = smooth(Math.min(1, Math.max(0, (t - 0.22) / 0.78)))

    // hero framing sits just under the headline block (offsetTop ignores its scroll transform)
    // offsetTop/offsetHeight ignore the hero's scroll transform, so this is its resting layout
    const hero = heroRef.current
    const text = heroTextRef.current
    const heroBottom = hero && text ? hero.offsetTop + text.offsetTop + text.offsetHeight : vh * 0.5
    // The placeholder sits in normal flow exactly where the 3D window will be; give its CSS 3D
    // transform the stage camera's vanishing point (viewport centre) so its perspective matches.
    const ph = placeholderRef.current
    if (hero && ph) ph.style.setProperty('--ph-vy', `${vh / 2 - (hero.offsetTop + ph.offsetTop)}px`)
    const hw = isStacked ? vw * 0.94 : Math.min(vw * 0.74, 1180)
    const heroFrame = {
      x: (vw - hw) / 2,
      y: heroBottom + (isStacked ? 28 : 44),
      w: hw,
      h: isStacked ? (hw * COMPACT.h) / COMPACT.w : (hw * WIDE.h) / WIDE.w,
    }
    const play = playLayout(vw, vh, isStacked)
    const frame = lerpFrame(heroFrame, play.frame, e)
    // the compact window is framed whole and nearly face-on - the per-feature poses are tuned
    // for the wide window's 1440x900 coordinates
    const playPose: Pose = isStacked
      ? { focus: [COMPACT.w / 2, COMPACT.h / 2], zoom: 1, rx: 2, ry: 0 }
      : featureRef.current.pose
    stageRef.current?.setView(frame, lerpPose(heroPose(isStacked), playPose, e))

    // the static fallback follows the same frame
    const fb = fallbackRef.current
    if (fb) {
      fb.style.left = `${frame.x}px`
      fb.style.top = `${frame.y}px`
      fb.style.width = `${frame.w}px`
      fb.style.transform = `perspective(1600px) rotateX(${lerp(24, 4, e)}deg)`
    }

    // ---- the overlays (copy, headline, picker) follow on their own damped clock - see drawOverlay
    const o = overlayRef.current
    o.target = t
    o.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    o.layout = { stacked: isStacked, vh, panelLeft: play.panel.left }
    if (!o.primed) {
      // first measure (including loading the page already scrolled down): start in place
      o.primed = true
      o.shown = t
    }
    drawOverlay(o.shown)
    if (!o.raf && o.shown !== o.target) {
      o.last = performance.now()
      o.raf = requestAnimationFrame(followScroll)
    }

    setStacked(isStacked)
    // interactive once the picker has mostly built out (Playground.tsx's reveal windows)
    setDocked(t > 0.75)
    // "in place" for the auto-demo: scrolled all the way through the rise-and-dock
    setInPlace(t >= 0.99)
    stageRef.current?.setDocked(t >= 0.99)
    setPanelPos(p =>
      p.left === play.panel.left && p.width === play.panel.width && p.top === play.panel.top
        ? p
        : play.panel,
    )
  }, [drawOverlay, followScroll])

  // ---- scroll / resize
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          apply()
        })
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(onScroll)
    if (stickyRef.current) ro.observe(stickyRef.current)
    if (heroRef.current) ro.observe(heroRef.current)
    // the headline stays parked on the panel's heading, and the panel is vertically centred - so
    // when its height changes (a feature row expanding) the heading moves and the headline follows
    if (panelRef.current) ro.observe(panelRef.current)
    registerPlaygroundTop(() => {
      const s = sectionRef.current
      if (!s) return 0
      return (
        s.getBoundingClientRect().top + window.scrollY + window.innerHeight * (TRANSITION + 0.05)
      )
    })
    const overlay = overlayRef.current
    return () => {
      window.removeEventListener('scroll', onScroll)
      ro.disconnect()
      cancelAnimationFrame(raf)
      cancelAnimationFrame(overlay.raf)
      overlay.raf = 0
      registerPlaygroundTop(null)
    }
  }, [apply])

  // ---- the picked feature: re-pose, and navigate the app (unless the app itself picked it)
  useEffect(() => {
    featureRef.current = featureById(featureId)
    apply()
    // The app switches to the picked feature's page only once the window is fully in place (not
    // while it's still rising) - its auto-demo then starts shortly after (see mockApp.setSettled).
    if (inPlace && source === 'page') stageRef.current?.navigate(featureRef.current.page)
  }, [featureId, source, inPlace, apply, stageState])

  // in-app navigation -> highlight the matching feature in the picker
  const onAppNavigate = useCallback((page: PageId, byUser: boolean) => {
    if (!byUser) return
    const f = featureForPage(page)
    if (f) useDemoStore.getState().select(f, 'app')
  }, [])

  // ---- create the 3D stage (lazily - three.js is its own chunk)
  useEffect(() => {
    let disposed = false
    let handle: StageHandle | null = null
    const host = hostRef.current
    if (!host) return
    const fonts = { sans: inter.style.fontFamily, display: unbounded.style.fontFamily }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowPower =
      window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4

    ;(async () => {
      try {
        // Start only once the page has loaded and the browser is idle: the CSS placeholder (an
        // exact snapshot of the hero window) carries the first impression, so none of the 3D
        // setup competes with first paint, hydration or the visitor's first interactions.
        await afterLoadAndIdle()
        if (disposed) return
        await Promise.all([
          ...['500', '600', '700', '800', '900', 'italic 900'].map(w =>
            document.fonts.load(`${w} 16px ${fonts.sans}`),
          ),
          ...['400', '600', '800'].map(w => document.fonts.load(`${w} 16px ${fonts.display}`)),
        ]).catch(() => undefined) // a font failing just means fallback glyphs, never no stage
        const { createStage } = await import('./engine/stage')
        if (disposed) return
        handle = await createStage(host, {
          fonts,
          reducedMotion,
          lowPower,
          compact: stacked,
          onNavigate: onAppNavigate,
        })
        if (disposed) {
          handle.dispose()
          return
        }
        stageRef.current = handle
        apply()
        // Draw the first frame *before* flipping to 'ready' (which starts the placeholder's
        // fade-out). Otherwise the placeholder began fading over a canvas that hadn't rendered
        // yet - the render loop only starts once the visibility observer below reports in - and
        // the hero blinked empty for a moment mid hand-over. The observer takes over from here
        // and pauses the loop again if the showcase is off screen.
        handle.setActive(true)
        await handle.firstRender
        if (disposed) return
        setStageState('ready')
      } catch (err) {
        // No WebGL (or a GPU blocklist) - real screenshots carry the showcase instead
        console.warn('3D showcase unavailable, using static screenshots:', err)
        if (!disposed) setStageState('failed')
      }
    })()

    return () => {
      disposed = true
      handle?.dispose()
      stageRef.current = null
    }
    // rebuilt when the layout crosses the stacked breakpoint (rotating a tablet, resizing)
  }, [apply, onAppNavigate, stacked])

  // ---- only render while the showcase is actually on screen
  useEffect(() => {
    const section = sectionRef.current
    if (!section || stageState !== 'ready') return
    const io = new IntersectionObserver(
      ([entry]) => stageRef.current?.setActive(entry.isIntersecting),
      { rootMargin: '100px 0px' },
    )
    io.observe(section)
    return () => io.disconnect()
  }, [stageState])

  return (
    <section
      ref={sectionRef}
      id='demo'
      aria-label='Steam Game Idler live demo'
      className={`relative ${inter.variable} ${unbounded.variable}`}
      style={{ height: `${100 + TRANSITION * 100 + 30}svh` }}
    >
      <div
        ref={stickyRef}
        className='showcase sticky top-0 h-svh w-full overflow-hidden'
        data-docked={docked || undefined}
      >
        <div className='showcase__glow' aria-hidden='true' />
        <div
          className={`showcase__dust-ph ${stageState === 'ready' ? 'showcase__dust-ph--off' : ''}`}
          style={{ boxShadow: DUST_PLACEHOLDER }}
          aria-hidden='true'
        />
        <div ref={hostRef} className='showcase__stage absolute inset-0' />
        <FallbackShot
          ref={fallbackRef}
          // without WebGL the hero keeps its placeholder; real screenshots only cover the playground
          visible={stageState === 'failed' && docked}
          featureId={docked && stageState === 'failed' ? featureId : null}
        />
        <div className='showcase__floor' aria-hidden='true' />

        <ShowcaseHero
          ref={heroRef}
          textRef={heroTextRef}
          headlineRef={headlineRef}
          placeholderRef={placeholderRef}
          live={stageState === 'ready'}
        />

        <Playground
          stacked={stacked}
          docked={docked}
          position={panelPos}
          panelRef={panelRef}
          headingRef={panelHeadingRef}
        />
      </div>
    </section>
  )
}
