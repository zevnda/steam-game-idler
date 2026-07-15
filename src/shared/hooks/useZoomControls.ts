import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@/shared/utils/invoke'

const ZOOM_STORAGE_KEY = 'zoomLevel'
const MIN_ZOOM = 0.7
const MAX_ZOOM = 1.3
const ZOOM_STEP = 0.1

const applyZoom = (scaleFactor: number) => {
  invoke('set_zoom', { scaleFactor }).catch(error => {
    console.error('Error in (set_zoom):', error)
  })
}

// Mounted once at the app root (`_app.tsx`), not just inside `DashboardShell` - unlike every other
// shortcut this rewrite has (all dashboard-scoped, see `useDashboardShortcuts.ts`), zoom is useful
// on the pre-dashboard sign-in screens too, matching `main`'s own `useZoomControls.ts` mounting on
// `pages/index.tsx` unconditionally. The zoom level itself is a pure frontend preference in
// `localStorage`, never `settings.json` - see `zoom.rs`'s doc comment for why the Rust side has
// nothing of its own to persist.
export const useZoomControls = () => {
  const [zoom, setZoom] = useState(1.0)

  useEffect(() => {
    const stored = localStorage.getItem(ZOOM_STORAGE_KEY)
    if (!stored) return
    const parsed = Number.parseFloat(stored)
    if (Number.isNaN(parsed)) return
    setZoom(parsed)
    applyZoom(parsed)
  }, [])

  const commitZoom = useCallback((newZoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom))
    setZoom(clamped)
    localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped))
    applyZoom(clamped)
  }, [])

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return

      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        commitZoom(zoom + ZOOM_STEP)
      } else if (e.key === '-') {
        e.preventDefault()
        commitZoom(zoom - ZOOM_STEP)
      } else if (e.key === '0') {
        e.preventDefault()
        commitZoom(1.0)
      }
    },
    [zoom, commitZoom],
  )

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      commitZoom(zoom + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP))
    },
    [zoom, commitZoom],
  )

  useEffect(() => {
    // Capture phase, matching `main`'s exact listener setup - keeps zoom shortcuts working even if
    // a descendant handler (e.g. a modal) calls `stopPropagation` on the bubble phase.
    document.addEventListener('keydown', handleKeydown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeydown, { capture: true })
  }, [handleKeydown])

  useEffect(() => {
    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [handleWheel])
}
