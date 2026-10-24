import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect } from 'react'

// Titlebar's height (Titlebar.tsx's h-14) - the band a drag starts from, matching the strip every
// modal paints over
const DRAG_BAND_PX = 56

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
function isWindowDrag(e: MouseEvent) {
  if (e.button !== 0 || e.clientY >= DRAG_BAND_PX) return false
  if (!(e.target instanceof Element) || e.target.closest(INTERACTIVE)) return false
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
   * Where it's mounted:
   * - `backdrop` - first child of a centred modal's `Modal.Backdrop`, before `Modal.Container`.
   *   Renders a drag strip: HeroUI's container is a full-window wrapper with `pointer-events: none`
   *   (only the dialog inside takes clicks), so presses on the empty backdrop along the top fall
   *   through to the strip, and a dialog that reaches into it (GlobalSearchModal sits near the
   *   top) comes later in the DOM and keeps its own clicks. Nothing scrolls under it.
   * - `dialog` - inside a full-window modal's `Modal.Dialog` (`size='cover'`/`'full'`), whose
   *   content *does* scroll through the top band. A strip there swallowed clicks on whatever
   *   scrolled under it, so this renders nothing and listens instead: a press in the band starts a
   *   window drag only when it isn't on something interactive or a scrollbar (see isWindowDrag),
   *   and a double-click toggles maximise, as Titlebar's drag region does.
   */
  placement: 'backdrop' | 'dialog'
}

/**
 * Keeps the window draggable while a modal is open. Every modal paints over Titlebar (same z-50,
 * later in the DOM - see Titlebar.tsx), taking its `data-tauri-drag-region` with it, so this puts
 * dragging back over the same top band. Alert dialogs don't get one: they're brief confirmations,
 * not something a user moves the window around with.
 *
 * The achievement manager and custom order overlays don't use this - their own header rows already
 * carry `data-tauri-drag-region` (see AchievementManagerSidebar.tsx / AchievementOrderHeader.tsx).
 */
export const ModalDragRegion = ({ placement }: ModalDragRegionProps) => {
  useEffect(() => {
    if (placement !== 'dialog') return

    const onMouseDown = (e: MouseEvent) => {
      if (!isWindowDrag(e)) return
      // no text selection starting under the pointer as the window moves
      e.preventDefault()
      getCurrentWindow()
        .startDragging()
        .catch(error => console.error('Error in (startDragging):', error))
    }
    const onDoubleClick = (e: MouseEvent) => {
      if (!isWindowDrag(e)) return
      getCurrentWindow()
        .toggleMaximize()
        .catch(error => console.error('Error in (toggleMaximize):', error))
    }

    // Only mounted while its modal is open (HeroUI renders a modal's contents only then), so the
    // listeners never outlive it
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('dblclick', onDoubleClick)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('dblclick', onDoubleClick)
    }
  }, [placement])

  if (placement === 'dialog') return null

  return (
    <div
      aria-hidden='true'
      className='fixed inset-x-0 top-0 h-14 select-none'
      data-tauri-drag-region
    />
  )
}
