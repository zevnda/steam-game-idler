'use client'

// Tiny timeline toolkit for the landing page's illustrations: a hover-to-play trigger, a clock that
// runs only while playing, a scripted fake cursor, and a particle burst. Every illustration is a
// pure function of `t` (seconds since play started) - unhovering resets t to 0, which resets the
// whole scene, with no per-step state to clean up.
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Plays while hovered or keyboard-focused. Devices that can't hover (phones/tablets) play while
 * the element is mostly on screen instead, so touch visitors still see every animation.
 */
export function usePlayTrigger<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(hover: hover)').matches) return
    const io = new IntersectionObserver(([e]) => setPlaying(e.isIntersecting), { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const handlers = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === 'mouse' && setPlaying(true),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === 'mouse' && setPlaying(false),
    onFocus: () => setPlaying(true),
    onBlur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setPlaying(false)
    },
  }
  return { ref, playing, handlers }
}

/** Plays whenever `ref`'s element is on screen (for sections that should just run). */
export function useInViewPlay<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setPlaying(e.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, playing }
}

interface ElapsedOptions {
  /**
   * How many times a looping storyboard replays before it stops and holds still. Capped by
   * default: touch devices autoplay these while they're on screen, and moving content that runs
   * on its own for more than a few seconds needs to stop by itself (WCAG 2.2.2). Leaving and
   * re-entering (unhover, or scrolling away and back) starts a fresh run.
   */
  cycles?: number
  /** the `t` to freeze on once the cycles run out, or under reduced motion (0 = resting state) */
  hold?: number
}

/**
 * Seconds since `playing` became true (0 while stopped), re-rendering every frame only while
 * playing. With `loop`, time wraps so a storyboard replays - up to `cycles` times.
 *
 * Under `prefers-reduced-motion` the clock never runs: a playing storyboard jumps straight to
 * its `hold` frame instead. (These scenes are rAF-driven, so the stylesheet's reduced-motion
 * block can't stop them - it has to happen here.)
 */
export function useElapsed(
  playing: boolean,
  loop?: number,
  { cycles = 3, hold = 0 }: ElapsedOptions = {},
) {
  const reduce = useReducedMotion()
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!playing) {
      setT(0)
      return
    }
    let raf = 0
    if (reduce) {
      // still via rAF (not a synchronous setState in the effect body), and only once playing -
      // never during hydration, where the server rendered t = 0
      raf = requestAnimationFrame(() => setT(hold))
      return () => cancelAnimationFrame(raf)
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const s = (now - t0) / 1000
      if (loop && s >= loop * cycles) {
        setT(hold)
        return
      }
      setT(loop ? s % loop : s)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, loop, cycles, hold, reduce])
  return t
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** 0..1 progress of `t` through [start, start + dur] */
export const prog = (t: number, start: number, dur: number) => clamp01((t - start) / dur)
export const easeOut = (p: number) => 1 - (1 - p) ** 3
export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2)
/** springy overshoot, settles at 1 */
export const easeBack = (p: number) => 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2

export interface CursorKey {
  t: number
  x: number
  y: number
  click?: boolean
}

/**
 * A scripted mouse pointer gliding between keys (px within its positioned parent); it dips
 * slightly on every `click` key. Fades in just before its first key and out after its last.
 */
export function FakeCursor({ keys, t }: { keys: CursorKey[]; t: number }) {
  if (!keys.length || t <= 0) return null
  let x = keys[0].x
  let y = keys[0].y
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (t >= b.t) {
      x = b.x
      y = b.y
      continue
    }
    if (t > a.t) {
      const p = easeInOut((t - a.t) / (b.t - a.t))
      x = a.x + (b.x - a.x) * p
      y = a.y + (b.y - a.y) * p
    }
    break
  }
  const first = keys[0].t
  const last = keys[keys.length - 1].t
  const opacity = Math.min(prog(t, first - 0.25, 0.25), 1 - prog(t, last + 0.6, 0.3))
  const click = keys.find(k => k.click && t >= k.t && t < k.t + 0.4)
  const press = click ? Math.sin(((t - click.t) / 0.4) * Math.PI) : 0
  return (
    <div
      className='fake-cursor'
      style={{ transform: `translate(${x}px, ${y}px)`, opacity }}
      aria-hidden='true'
    >
      <svg
        width='20'
        height='22'
        viewBox='0 0 20 22'
        style={{ transform: `scale(${1 - press * 0.15})` }}
      >
        <path
          d='M2 1.5 L2 17.5 L6.2 13.6 L9 20 L12 18.7 L9.3 12.5 L15 12.3 Z'
          fill='#fff'
          stroke='#000'
          strokeWidth='1.3'
          strokeLinejoin='round'
        />
      </svg>
    </div>
  )
}

/**
 * A one-shot particle burst. Remount it (change its key) to fire again; particles fly out on
 * deterministic angles so server and client render identically.
 */
export function Burst({
  x,
  y,
  colors,
  count = 12,
  spread = 46,
  shape = 'dot',
}: {
  x: number
  y: number
  colors: string[]
  count?: number
  spread?: number
  shape?: 'dot' | 'confetti' | 'star'
}) {
  return (
    <span className='burst' style={{ left: x, top: y }} aria-hidden='true'>
      {Array.from({ length: count }, (_, i) => i).map(i => {
        const a = (i / count) * Math.PI * 2 + (i % 2) * 0.3
        const d = spread * (0.65 + ((i * 37) % 10) / 22)
        return (
          <i
            key={a}
            className={`burst__p burst__p--${shape}`}
            style={
              {
                '--dx': `${Math.cos(a) * d}px`,
                '--dy': `${Math.sin(a) * d - (shape === 'confetti' ? 18 : 0)}px`,
                '--rot': `${(i * 67) % 360}deg`,
                'background': colors[i % colors.length],
                'animationDelay': `${(i % 3) * 25}ms`,
              } as CSSProperties
            }
          />
        )
      })}
    </span>
  )
}
