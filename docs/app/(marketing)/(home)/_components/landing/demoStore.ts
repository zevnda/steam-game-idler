import type { FeatureId } from './features'
import { create } from 'zustand'

/**
 * Shared state for the landing page's live 3D demo, so sections far from the showcase (the bento
 * grid's "Try it live" buttons) can drive it.
 *
 * `source` records who picked the feature: a pick from the page navigates the mock app to that
 * feature's page, while a pick that came *from* the mock (its own sidebar) must not navigate
 * again - the app is already where the user put it (e.g. on Games rather than Idling).
 */
interface DemoState {
  feature: FeatureId
  source: 'page' | 'app'
  select: (feature: FeatureId, source?: 'page' | 'app') => void
}

export const useDemoStore = create<DemoState>(set => ({
  feature: 'games',
  source: 'page',
  select: (feature, source = 'page') => set({ feature, source }),
}))

/** The showcase's scroll position at which the playground is fully docked (set by Showcase). */
let playgroundTop: (() => number) | null = null
export function registerPlaygroundTop(fn: (() => number) | null) {
  playgroundTop = fn
}

/**
 * Smooth for in-page jumps, instant under reduced motion. Browsers don't apply the OS setting to
 * an explicit `behavior: 'smooth'` themselves, so every scripted scroll on the page goes through
 * this.
 */
export function scrollBehavior() {
  const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
  return behavior
}

/** Scrolls the page to the docked playground - used by every "Try it live" entry point. */
export function scrollToPlayground() {
  const top = playgroundTop?.()
  if (top === undefined) return
  window.scrollTo({ top, behavior: scrollBehavior() })
}
