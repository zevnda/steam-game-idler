import type { SettingsTab } from '@/shared/stores/settingsModalStore'
import type { NextRouter } from 'next/router'
import { flushSync } from 'react-dom'
import Router from 'next/router'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'

// Crossfades with the View Transitions API wherever the app swaps one whole view for another:
// dashboard pages, Settings categories, a page's tabs, the Achievement Manager's views. The old
// content fades out while the new fades in, instead of one replacing the other. Between two
// near-identical views (Achievement Unlocker and Auto Idle, say) only what actually differs visibly
// changes. Anything that can't do it switches instantly instead - see `canTransition`.
//
// Deliberately not used for sorting, filtering, search or live data (timers, progress): those
// rearrange or update the same content rather than replace it, and a crossfade there just blurs
// items into each other.
//
// Each kind of transition names only its own area, via this attribute on <html> (globals.css maps
// it to a `view-transition-name`). The browser draws named areas in a layer above everything else
// for the transition's duration, so a name left on the dashboard's content area while Settings
// crossfades would paint the dashboard over the Settings modal. Nothing else is named either:
// HeroUI's base styles set `view-transition-name: none` on :root on purpose, which keeps the rest of
// the window (sidebar, titlebar, modals) live and clickable during a transition.
const SCOPE_ATTR = 'data-view-transition'

// Each maps to one `*-transition-area` class in globals.css:
//   page                - DashboardShell's <main>, between routes
//   settings            - the selected Settings category panel
//   tabs                - a dashboard page's tabs and their toolbar (the toolbar floats over the
//                         content, so it has to be inside the area or the content would cover it)
//   achievement-manager - the Achievement Manager's content column, between its views
export type TransitionScope = 'page' | 'settings' | 'tabs' | 'achievement-manager'

// Falls back to an instant switch where the API doesn't exist (older WebKitGTK), for reduced motion,
// and under `forceReducedMotion` - the slow WebKitGTK builds that already skip other large animations.
const canTransition = () =>
  typeof document.startViewTransition === 'function' &&
  usePlatformStore.getState().forceReducedMotion !== true &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Starting a transition while one is running skips the first, whose `finished` then settles while
// the new one is still going - so only the newest transition may clear the attribute.
let latestTransition: ViewTransition | null = null

// Runs `update` inside a crossfade of `scope`'s area. `update` must make the whole DOM change and
// only settle once it has: the browser snapshots the old state before calling it and the new state
// after it settles.
const runTransition = (scope: TransitionScope, update: () => Promise<void> | void) => {
  if (!canTransition()) return Promise.resolve(update())

  const root = document.documentElement
  root.setAttribute(SCOPE_ATTR, scope)
  const transition = document.startViewTransition(update)
  latestTransition = transition
  transition.finished
    .catch(() => {})
    .finally(() => {
      if (latestTransition === transition) {
        root.removeAttribute(SCOPE_ATTR)
        latestTransition = null
      }
    })
  return transition.updateCallbackDone.catch(() => {})
}

// Page-to-page navigation goes through here rather than a bare `router.push`: the transition has to
// start before the route changes, and Next's routeChangeStart event fires too late to start one.
// Resolves once the new page has rendered.
//
// `beforeNavigate` runs inside the same transition, just before the route change - for a state
// change that should fade along with it (switching account changes what every page shows). Already
// on `href`, only that runs: a push to the current page fires no routeChangeComplete to wait for.
export const navigateWithPageTransition = (
  router: NextRouter,
  href: string,
  beforeNavigate?: () => void,
) => {
  if (router.pathname === href) {
    if (!beforeNavigate) return Promise.resolve()
    return runTransition('page', () => {
      flushSync(beforeNavigate)
    })
  }
  return runTransition(
    'page',
    () =>
      new Promise<void>(resolve => {
        const done = () => {
          Router.events.off('routeChangeComplete', done)
          Router.events.off('routeChangeError', done)
          resolve()
        }
        Router.events.on('routeChangeComplete', done)
        Router.events.on('routeChangeError', done)
        if (beforeNavigate) flushSync(beforeNavigate)
        void router.push(href)
      }),
  )
}

// Swaps one view for another inside `scope`'s area - a state update (tab, view) rather than a route
// change. `flushSync` so the new view has rendered by the time the update returns, which is when the
// browser takes its "after" snapshot.
export const switchViewWithTransition = (scope: TransitionScope, update: () => void) => {
  void runTransition(scope, () => {
    flushSync(update)
  })
}

// The Settings modal's category switch.
export const switchSettingsTab = (tab: SettingsTab) => {
  if (useSettingsModalStore.getState().activeTab === tab) return
  switchViewWithTransition('settings', () => useSettingsModalStore.getState().setActiveTab(tab))
}
