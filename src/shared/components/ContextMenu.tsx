import type { ContextMenuEntry } from '@/shared/stores/contextMenuStore'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, Separator } from '@heroui/react'
import { useContextMenuStore } from '@/shared/stores/contextMenuStore'

// Rough width of an open menu, used only to choose which side of the cursor it opens on. The real
// width varies with the labels (and their translations), and react-aria still shifts the menu to
// stay inside the window if this guess is off.
const MENU_WIDTH_ESTIMATE = 260

// Marks the menu's own elements, so useContextMenu.ts can ignore a right-click on the menu itself
export const CONTEXT_MENU_ATTR = 'data-app-context-menu'

const renderEntries = (entries: ContextMenuEntry[]) =>
  entries.map(entry => {
    if (entry.kind === 'separator') return <Separator key={entry.id} />

    const content = (
      <>
        {entry.icon && <entry.icon className='shrink-0' fontSize={16} />}
        <span className='min-w-0 flex-1'>{entry.label}</span>
      </>
    )

    if (entry.kind === 'submenu') {
      return (
        <Dropdown.SubmenuTrigger key={entry.id}>
          <Dropdown.Item id={entry.id} textValue={entry.label}>
            {content}
            <Dropdown.SubmenuIndicator />
          </Dropdown.Item>
          <Dropdown.Popover {...{ [CONTEXT_MENU_ATTR]: '' }}>
            <Dropdown.Menu aria-label={entry.label}>{renderEntries(entry.items)}</Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.SubmenuTrigger>
      )
    }

    return (
      <Dropdown.Item
        key={entry.id}
        id={entry.id}
        isDisabled={entry.isDisabled}
        textValue={entry.label}
        onAction={() => void entry.onAction()}
      >
        {content}
      </Dropdown.Item>
    )
  })

// The app's right-click menu, styled like the rest of the app instead of the OS's native menu.
// Mounted once at the root (`_app.tsx`); useContextMenu.ts decides what goes in it and opens it.
//
// It's an ordinary dropdown anchored to an invisible point at the cursor, so react-aria handles
// placement the way a native menu does: it opens below the cursor, flips above when there isn't
// room, and shifts to stay inside the window. Native menus also close the moment the window loses
// focus, is resized or scrolls underneath them, which a dropdown doesn't do on its own, so those
// are handled here.
//
// The popover is non-modal. A modal one covers the window with an invisible layer that catches
// clicks outside it, so right-clicking another game card while a menu was open (or still fading
// out) hit that layer instead, and opened the plain Copy/Paste menu. Without the layer, closing on
// a press outside is handled here too: a left press closes the menu and is swallowed, as a native
// menu does, so it doesn't also press whatever is under it. A right press passes through, so
// useContextMenu.ts opens a new menu for what was clicked.
export const ContextMenu = () => {
  const { t } = useTranslation()
  const menu = useContextMenuStore(state => state.menu)
  const close = useContextMenuStore(state => state.close)

  useEffect(() => {
    if (!menu) return
    const isInMenu = (target: EventTarget | null) =>
      target instanceof Element && target.closest(`[${CONTEXT_MENU_ATTR}]`) !== null
    const onWheel = (event: WheelEvent) => {
      if (!isInMenu(event.target)) close()
    }
    const swallow = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (isInMenu(event.target)) return
      close()
      if (event.button !== 0) return
      swallow(event)
      // The rest of this press, so the element under it never sees a click
      const swallowClick = (click: Event) => {
        swallow(click)
        window.removeEventListener('click', swallowClick, true)
      }
      window.addEventListener('mousedown', swallow, { capture: true, once: true })
      window.addEventListener('mouseup', swallow, { capture: true, once: true })
      window.addEventListener('click', swallowClick, true)
      // A press that never becomes a click (dragged off, for example) mustn't leave the listener
      // eating the next real one
      setTimeout(() => window.removeEventListener('click', swallowClick, true), 500)
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('blur', close)
    window.addEventListener('resize', close)
    window.addEventListener('wheel', onWheel, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('blur', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('wheel', onWheel, { capture: true })
    }
  }, [menu, close])

  if (!menu) return null

  // Opens to the right of the cursor, or to its left when it would run past the window's right
  // edge, matching a native menu.
  const placement = menu.x + MENU_WIDTH_ESTIMATE > window.innerWidth ? 'bottom end' : 'bottom start'

  return (
    <Dropdown.Root
      key={menu.key}
      isOpen
      onOpenChange={isOpen => {
        if (!isOpen) close()
      }}
    >
      {/* The point the menu is anchored to. Never seen or reached by the user: the menu opens from
          the store, not from pressing this. */}
      <Dropdown.Trigger
        aria-hidden
        className='pointer-events-none fixed size-0 opacity-0'
        style={{ left: menu.x, top: menu.y }}
      >
        <span />
      </Dropdown.Trigger>
      <Dropdown.Popover
        isNonModal
        offset={2}
        placement={placement}
        {...{ [CONTEXT_MENU_ATTR]: '' }}
      >
        <Dropdown.Menu aria-label={t('common.menu')}>{renderEntries(menu.entries)}</Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  )
}
