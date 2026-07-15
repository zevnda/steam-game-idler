import { useEffect } from 'react'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'

// Mounted once in DashboardShell - hydrates `sortPreferencesStore` from `localStorage` on mount
// (mirrors `sidebarStore`'s own hydrate-on-mount shape, called from a single site for the same
// reason: localStorage isn't available during Next.js's SSR pass). Every sort dropdown (games,
// favorites, achievement-unlocker, auto-idle, card farming, achievement manager) reads/writes the
// one store this hydrates, so a preference set on any of them survives navigation, reload, and app
// restarts.
export const useSortPreferencesSync = () => {
  useEffect(() => {
    useSortPreferencesStore.getState().hydrate()
  }, [])
}
