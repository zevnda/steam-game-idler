import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect } from 'react'

// Titlebar's height (Titlebar.tsx's h-14) - the band a `fullWindow` modal drags from
const DRAG_BAND_PX = 56

// What drags the window in a modal that doesn't fill it: its header, the empty edge of the dialog,
// and whatever a headerless modal marks with `data-modal-drag` (SettingsModal.tsx).
const DRAG_SURFACE = "[data-slot='modal-header'],[data-modal-drag]"

// What keeps its own press inside the band: anything a user clicks to do something. Everything
// else there (empty space, headings, plain text) drags the window, as Titlebar's own space does.
const INTERACTIVE = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'label',
  'summary',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[role="textbox"]',
  '[role="combobox"]',
].join(',')

/** Whether a press at `e` should drag the window rather than reach what's under it. */
function isWindowDrag(e: MouseEvent, fullWindow: boolean) {
  if (e.button !== 0) return false
  if (!(e.target instanceof Element) || e.target.closest(INTERACTIVE)) return false
  const isOnSurface = fullWindow
    ? e.clientY < DRAG_BAND_PX
    : e.target.matches("[data-slot='modal-dialog']") || e.target.closest(DRAG_SURFACE) !== null
  if (!isOnSurface) return false
  // A press on a scroll container's own scrollbar (past its content box) scrolls, not drags. Only
  // for elements that actually scroll: an inline element's clientWidth is 0, which would read
  // every press on plain text as "on the scrollbar".
  const el = e.target
  if (
    el instanceof HTMLElement &&
    el.scrollHeight > el.clientHeight &&
    e.offsetX >= el.clientWidth
  ) {
    return false
  }
  return true
}

interface ModalDragRegionProps {
  /**
   * For a modal that fills the window (GoProModal), so has no backdrop to click and nothing around it
   * to drag by: any press in the top band that isn't on something interactive drags instead.
   */
  fullWindow?: boolean
}

/**
 * Keeps the window draggable while a modal is open, since every modal paints over Titlebar (same
 * z-50, later in the DOM - see Titlebar.tsx). Renders nothing: mount it anywhere inside the modal.
 *
 * Dragging comes from the modal's own surface, as it does in the achievement manager and custom
 * order overlays, whose header rows carry `data-tauri-drag-region` instead (see
 * AchievementManagerSidebar.tsx / AchievementOrderHeader.tsx). Not from an invisible strip over the
 * backdrop: that strip looked like the dimmed titlebar behind it, and a click on it dragged the
 * window instead of closing the modal, while a click on the rest of the backdrop closed it. Alert
 * dialogs don't get one: they're brief confirmations, not something a user moves the window with.
 */
export const ModalDragRegion = ({ fullWindow = false }: ModalDragRegionProps) => {
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      // Already handled by another open modal's region, as with a modal opened from Settings
      if (e.defaultPrevented || !isWindowDrag(e, fullWindow)) return
      // no text selection starting under the pointer as the window moves
      e.preventDefault()
      const appWindow = getCurrentWindow()
      // The second press rather than a `dblclick` listener, which never fires: the first press's
      // native drag swallows the mouse-up it needs. Tauri's own `data-tauri-drag-region` does the same.
      if (e.detail === 2) {
        appWindow
          .toggleMaximize()
          .catch(error => console.error('Error in (toggleMaximize):', error))
      } else {
        appWindow.startDragging().catch(error => console.error('Error in (startDragging):', error))
      }
    }

    // Only mounted while its modal is open (HeroUI renders a modal's contents only then), so the
    // listener never outlives it
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [fullWindow])

  return null
}
