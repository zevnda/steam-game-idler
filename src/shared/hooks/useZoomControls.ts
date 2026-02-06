import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showDangerToast } from '@/shared/ui'
import { logEvent } from '@/shared/utils'

export function useZoomControls() {
  const { t } = useTranslation()
  const [zoom, setZoom] = useState(1.0)

  // Set initial zoom level from localStorage
  useEffect(() => {
    const storedZoom = localStorage.getItem('zoomLevel')
    if (storedZoom) {
      const parsedZoom = parseFloat(storedZoom)
      if (!isNaN(parsedZoom)) {
        setZoom(parsedZoom)
        invoke('set_zoom', { scaleFactor: parsedZoom })
      }
    }
  }, [])

  // Zoom controls
  const handleZoomControls = useCallback(
    async (e: KeyboardEvent) => {
      try {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === '=' || e.key === '+') {
            e.preventDefault()
            const newZoom = Math.min(zoom + 0.1, 1.3)
            setZoom(newZoom)
            localStorage.setItem('zoomLevel', newZoom.toString())
            await invoke('set_zoom', { scaleFactor: newZoom })
          } else if (e.key === '-') {
            e.preventDefault()
            const newZoom = Math.max(zoom - 0.1, 0.7)
            setZoom(newZoom)
            localStorage.setItem('zoomLevel', newZoom.toString())
            await invoke('set_zoom', { scaleFactor: newZoom })
          } else if (e.key === '0') {
            e.preventDefault()
            setZoom(1.0)
            localStorage.setItem('zoomLevel', '1.0')
            await invoke('set_zoom', { scaleFactor: 1.0 })
          }
        }
      } catch (error) {
        showDangerToast(t('common.error'))
        console.error('Error in (handleZoomControls):', error)
        logEvent(`[Error] in (handleZoomControls): ${error}`)
      }
    },
    [zoom, t],
  )

  // Zoom controls - mouse wheel
  const handleWheelZoom = useCallback(
    async (e: WheelEvent) => {
      try {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const delta = e.deltaY > 0 ? -0.1 : 0.1
          const newZoom = Math.min(Math.max(zoom + delta, 0.7), 1.3)
          setZoom(newZoom)
          localStorage.setItem('zoomLevel', newZoom.toString())
          await invoke('set_zoom', { scaleFactor: newZoom })
        }
      } catch (error) {
        showDangerToast(t('common.error'))
        console.error('Error in (handleWheelZoom):', error)
        logEvent(`[Error] in (handleWheelZoom): ${error}`)
      }
    },
    [zoom, t],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleZoomControls, { capture: true })
    return () => document.removeEventListener('keydown', handleZoomControls, { capture: true })
  }, [handleZoomControls])

  useEffect(() => {
    document.addEventListener('wheel', handleWheelZoom, { passive: false })
    return () => document.removeEventListener('wheel', handleWheelZoom)
  }, [handleWheelZoom])
}
