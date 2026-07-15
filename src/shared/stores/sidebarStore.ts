import { create } from 'zustand'

const STORAGE_KEY = 'sidebarCollapsed'

interface SidebarStore {
  collapsed: boolean
  // False until `hydrate()` runs once on mount. Every consumer that animates a width/margin off
  // `collapsed` (Sidebar.tsx, Titlebar.tsx) gates its transition class on this, so a returning
  // user's persisted-collapsed preference applies to the very first paint that shows it instead of
  // visibly animating from the default (expanded) state right after mount.
  hydrated: boolean
  // Reads the persisted preference once - called from Sidebar.tsx's mount effect rather than at
  // module init, since `localStorage` doesn't exist during Next.js's server-side render pass.
  hydrate: () => void
  toggle: () => void
}

// Plain synchronous store (no backend round trip involved, unlike e.g. antiAwayStore) - the
// collapsed/expanded preference is a pure frontend concern persisted to `localStorage`, matching
// `main`'s own `sidebarCollapsed` key exactly (this isn't a property of the Steam account or the
// app installation, just this window's UI state).
export const useSidebarStore = create<SidebarStore>((set, get) => ({
  collapsed: false,
  hydrated: false,
  hydrate: () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    set({ collapsed: stored === null ? get().collapsed : stored === 'true', hydrated: true })
  },
  toggle: () => {
    const next = !get().collapsed
    localStorage.setItem(STORAGE_KEY, String(next))
    set({ collapsed: next })
  },
}))
