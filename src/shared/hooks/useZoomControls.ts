import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'

export function useZoomControls() {
  const { t } = useTranslation()
  const [zoom, setZoom] = useState(1.0)

  useEffect(() => {
    const stored = localStorage.getItem('zoomLevel')
    if (stored) {
      const parsed = parseFloat(stored)
      if (!isNaN(parsed)) {
        setZoom(parsed)
        invoke('set_zoom', { scaleFactor: parsed })
      }
    }
  }, [])

  const handleKeydown = useCallback(
    async (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      try {
        let newZoom = zoom
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          newZoom = Math.min(zoom + 0.1, 1.3)
        } else if (e.key === '-') {
          e.preventDefault()
          newZoom = Math.max(zoom - 0.1, 0.7)
        } else if (e.key === '0') {
          e.preventDefault()
          newZoom = 1.0
        } else {
          return
        }
        setZoom(newZoom)
        localStorage.setItem('zoomLevel', newZoom.toString())
        await invoke('set_zoom', { scaleFactor: newZoom })
      } catch (error) {
        toast.danger(t('common.error'))
        console.error('Error in handleZoomControls:', error)
        await logEvent(`[Error] in (handleZoomControls): ${error}`)
      }
    },
    [zoom, t],
  )

  const handleWheel = useCallback(
    async (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      try {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        const newZoom = Math.min(Math.max(zoom + delta, 0.7), 1.3)
        setZoom(newZoom)
        localStorage.setItem('zoomLevel', newZoom.toString())
        await invoke('set_zoom', { scaleFactor: newZoom })
      } catch (error) {
        toast.danger(t('common.error'))
        console.error('Error in handleWheelZoom:', error)
        await logEvent(`[Error] in (handleWheelZoom): ${error}`)
      }
    },
    [zoom, t],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeydown, { capture: true })
  }, [handleKeydown])

  useEffect(() => {
    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [handleWheel])
}
