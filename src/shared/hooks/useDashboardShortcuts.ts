import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSidebarStore } from '@/shared/stores/sidebarStore'

// Same order as Sidebar.tsx's `sections` array flattened - kept as its own literal here rather
// than derived from that array, matching `main`'s own `SIDEBAR_PAGES` const in
// `useKeyboardShortcuts.ts` (a second copy of a short, rarely-changing list is simpler than a
// shared export that only this hook would ever consume).
const DASHBOARD_ROUTES = [
  '/dashboard',
  '/dashboard/idling',
  '/dashboard/favorites',
  '/dashboard/free-games',
  '/dashboard/card-farming',
  '/dashboard/achievement-unlocker',
  '/dashboard/auto-idle',
  '/dashboard/inventory-manager',
]

// Mounted once in DashboardShell, not the app root - unlike `useZoomControls`/
// `useGlobalSearchShortcut`, every shortcut here (tab-cycling, settings toggle, sidebar collapse)
// only makes sense once a dashboard is actually on screen. Reaches parity with `main`'s
// `useKeyboardShortcuts.ts` minus the Ctrl+Shift+H Chatway help-desk shortcut - that widget is a
// `main`-only third-party embed with no equivalent in this rewrite, so it's deliberately dropped
// rather than ported to nothing.
export const useDashboardShortcuts = () => {
  const router = useRouter()

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return

      if (!e.ctrlKey && !e.metaKey) return

      const isSettingsOpen = useSettingsModalStore.getState().isOpen

      if (e.key === ']' || e.key === '[') {
        // Skip while Settings is open - cycling the page underneath a modal that's still open reads
        // as broken rather than useful (see this hook's own doc comment).
        if (isSettingsOpen) return
        e.preventDefault()
        const currentIndex = DASHBOARD_ROUTES.indexOf(router.pathname)
        const base = currentIndex === -1 ? 0 : currentIndex
        const delta = e.key === ']' ? 1 : -1
        const nextIndex = (base + delta + DASHBOARD_ROUTES.length) % DASHBOARD_ROUTES.length
        router.push(DASHBOARD_ROUTES[nextIndex])
        return
      }

      if (e.key === ',') {
        e.preventDefault()
        if (isSettingsOpen) {
          useSettingsModalStore.getState().close()
        } else {
          useSettingsModalStore.getState().open()
        }
        return
      }

      if ((e.key === 'w' || e.key === 'W') && !e.shiftKey) {
        e.preventDefault()
        useSidebarStore.getState().toggle()
      }
    },
    [router],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])
}
