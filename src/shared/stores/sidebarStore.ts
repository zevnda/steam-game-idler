import { create } from 'zustand'

const STORAGE_KEY = 'sidebarCollapsed'

// Tailwind's `lg` breakpoint - the same width below which GlobalSearchBar narrows its pill, so the
// titlebar and sidebar make room together. `matchMedia` works in CSS px, same as Tailwind's own
// breakpoints, so the app's zoom level (zoom.rs) shifts both identically.
export const NARROW_WINDOW_QUERY = '(max-width: 1023.98px)'

interface SidebarStore {
  // The effective, rendered state - what every consumer reads.
  collapsed: boolean
  // The user's own persisted choice, made while the window is wide. Kept separate from
  // `collapsed` so a narrow window's forced collapse never overwrites it, and widening the window
  // again restores exactly what the user had picked.
  preference: boolean
  // True while the window is below `NARROW_WINDOW_QUERY`'s breakpoint. Driven by Sidebar.tsx's
  // `matchMedia` listener via `setNarrow`.
  narrow: boolean
  // False until `hydrate()` runs once on mount. Every consumer that animates a width/margin off
  // `collapsed` (Sidebar.tsx, Titlebar.tsx) gates its transition class on this, so a returning
  // user's persisted-collapsed preference applies to the very first paint that shows it instead of
  // visibly animating from the default (expanded) state right after mount.
  hydrated: boolean
  // Reads the persisted preference and the current window width once - called from Sidebar.tsx's
  // mount effect rather than at module init, since `localStorage`/`matchMedia` don't exist during
  // Next.js's server-side render pass.
  hydrate: () => void
  // Crossing into narrow always collapses; crossing back to wide restores `preference`. Only acts
  // on an actual transition, so a temporary manual expand while narrow (see `toggle`) sticks until
  // the window crosses the breakpoint again.
  setNarrow: (narrow: boolean) => void
  // Wide: flips and persists the user's preference. Narrow: a temporary override that isn't
  // persisted - otherwise peeking at the expanded sidebar in a small window would silently change
  // what the user gets back at full size.
  toggle: () => void
}

// Plain synchronous store (no backend round trip involved, unlike e.g. antiAwayStore) - the
// collapsed/expanded preference is a pure frontend concern persisted to `localStorage`, matching
// `main`'s own `sidebarCollapsed` key exactly (this isn't a property of the Steam account or the
// app installation, just this window's UI state).
export const useSidebarStore = create<SidebarStore>((set, get) => ({
  collapsed: false,
  preference: false,
  narrow: false,
  hydrated: false,
  hydrate: () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const preference = stored === null ? get().preference : stored === 'true'
    const narrow = window.matchMedia(NARROW_WINDOW_QUERY).matches
    set({ preference, narrow, collapsed: narrow || preference, hydrated: true })
  },
  setNarrow: narrow => {
    if (narrow === get().narrow) return
    set({ narrow, collapsed: narrow || get().preference })
  },
  toggle: () => {
    const next = !get().collapsed
    if (get().narrow) {
      set({ collapsed: next })
      return
    }
    localStorage.setItem(STORAGE_KEY, String(next))
    set({ collapsed: next, preference: next })
  },
}))
