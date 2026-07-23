import type { MouseEvent as ReactMouseEvent } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useState } from 'react'
import { usePlatformStore } from '@/shared/stores/platformStore'

// `@tauri-apps/api/window` declares this type only for `startResizeDragging`'s own parameter,
// without exporting it - re-declared locally rather than fighting the module for an export it
// doesn't offer. Kept in sync with that package's own `ResizeDirection` by construction: this is
// exactly the parameter type TypeScript would infer for `getCurrentWindow().startResizeDragging`.
type ResizeDirection = Parameters<ReturnType<typeof getCurrentWindow>['startResizeDragging']>[0]

// Linux-only stand-in for the native OS-level resize border Windows already gets "for free" on an
// undecorated-but-resizable window (Windows keeps one regardless of `decorations: false`; Linux
// has no equivalent). Tauri/wry's own built-in GTK resize-drag hook (`tauri-runtime-wry`'s
// `attach_resize_handler`, entirely native - no permission or JS involvement at all) is wired up
// unconditionally, but a real VM test confirmed it silently does nothing under this app's Wayland
// session despite the window being genuinely resizable at the compositor level (GNOME's own
// Alt+F8 resize-mode works fine) - a Wayland input-event-serial issue somewhere in WebKitGTK's
// own event forwarding is the leading theory, not something fixable from this app's code. This
// works around it entirely by driving the *other* resize path instead: `Window.
// startResizeDragging()`, the JS-callable API `core:window:allow-start-resize-dragging` actually
// gates (added defensively in an earlier session before this second, real mechanism was found -
// now it finally has a real caller).
export const LinuxResizeHandles = () => {
  const currentOs = usePlatformStore(state => state.currentOs)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (currentOs !== 'linux') return

    const appWindow = getCurrentWindow()
    let isMounted = true

    appWindow.isMaximized().then(maximized => {
      if (isMounted) setIsMaximized(maximized)
    })

    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized)
    })

    return () => {
      isMounted = false
      unlisten.then(stop => stop())
    }
  }, [currentOs])

  if (currentOs !== 'linux' || isMaximized) return null

  const startResize = (direction: ResizeDirection) => (e: ReactMouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    getCurrentWindow()
      .startResizeDragging(direction)
      .catch(error => console.error('Error in (startResizeDragging):', error))
  }

  return (
    <>
      <div
        className='fixed left-3 right-3 top-0 z-10000 h-1.5 cursor-ns-resize'
        onMouseDown={startResize('North')}
      />
      <div
        className='fixed bottom-0 left-3 right-3 z-10000 h-1.5 cursor-ns-resize'
        onMouseDown={startResize('South')}
      />
      <div
        className='fixed bottom-3 left-0 top-3 z-10000 w-1.5 cursor-ew-resize'
        onMouseDown={startResize('West')}
      />
      <div
        className='fixed bottom-3 right-0 top-3 z-10000 w-1.5 cursor-ew-resize'
        onMouseDown={startResize('East')}
      />
      <div
        className='fixed left-0 top-0 z-10000 h-3 w-3 cursor-nwse-resize'
        onMouseDown={startResize('NorthWest')}
      />
      <div
        className='fixed right-0 top-0 z-10000 h-3 w-3 cursor-nesw-resize'
        onMouseDown={startResize('NorthEast')}
      />
      <div
        className='fixed bottom-0 left-0 z-10000 h-3 w-3 cursor-nesw-resize'
        onMouseDown={startResize('SouthWest')}
      />
      <div
        className='fixed bottom-0 right-0 z-10000 h-3 w-3 cursor-nwse-resize'
        onMouseDown={startResize('SouthEast')}
      />
    </>
  )
}
