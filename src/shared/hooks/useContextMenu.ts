import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbClipboard, TbCopy } from 'react-icons/tb'
import { CONTEXT_MENU_ATTR } from '@/shared/components/ContextMenu'
import { useContextMenuStore } from '@/shared/stores/contextMenuStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { buildGameCardMenu } from '@/shared/utils/buildGameCardMenu'
import { findGameCardTarget } from '@/shared/utils/gameCardContext'
import { invoke } from '@/shared/utils/invoke'

// Mounted once at the app root (`_app.tsx`), same root-level reasoning as `useZoomControls` -
// refreshing during pre-dashboard sign-in isn't safe either (a mid-flow reload of the local-sign-in
// webview/QR login would just orphan that state).
//
// Refreshing the window (F5/Ctrl+R/Ctrl+Shift+R) while a game is idling or an automation
// (achievement unlocker, card farming, auto-idle) is running tears down the whole React tree
// without telling the backend - idling processes/agent sessions carry on server-side, but the
// frontend's view of "what's running" goes out of sync until a full app relaunch. Blocking refresh
// is simpler and safer than making every automation re-hydrate its state correctly from a mid-run
// reload. Right-clicking the window also exposes the native context menu's own "Reload" entry, so
// that's replaced with a custom Copy/Paste-only menu below - otherwise text selection would have no
// way to be copied at all. Both menus render through the app's own ContextMenu.tsx (not the OS's
// native menu), so they match the rest of the UI. Skipped in dev, where refreshing to pick up changes is expected;
// Ctrl+Alt+Shift+F5 still force-reloads regardless, for recovering a genuinely stuck window without
// relaunching the app. Right-clicking a game card anywhere (games list, favorites,
// achievement-unlocker, auto-idle, card-farming - any component whose root carries
// gameCardContext.ts's data attributes) instead pops a game-specific menu built by
// buildGameCardMenu.ts, since that's a fundamentally different action set than the
// window-wide Copy/Paste fallback below.
// Where the menu opens: at the cursor, or under the focused element for the keyboard's menu key
// (Shift+F10 / the Menu key), whose event has no pointer position.
function menuPosition(event: MouseEvent) {
  if (event.clientX !== 0 || event.clientY !== 0 || !(event.target instanceof Element)) {
    return { x: event.clientX, y: event.clientY }
  }
  const rect = event.target.getBoundingClientRect()
  return { x: rect.left, y: rect.bottom }
}

// While a menu is open, react-aria covers the page with an invisible layer (so a click outside closes
// the menu), and a right-click lands on that instead of what's under it. Like a native menu, a
// right-click elsewhere should open a new menu for whatever is actually there, so look through the
// layer.
function resolveTarget(event: MouseEvent) {
  if (!useContextMenuStore.getState().menu) return event.target
  return (
    document
      .elementsFromPoint(event.clientX, event.clientY)
      .find(
        element =>
          element.getAttribute('data-testid') !== 'underlay' &&
          !element.closest(`[${CONTEXT_MENU_ATTR}]`),
      ) ?? event.target
  )
}

export function useContextMenu() {
  const { t } = useTranslation()
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    invoke<boolean>('is_dev')
      .then(setIsDev)
      .catch(error => console.error('Error in (is_dev):', error))
  }, [])

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'F5') {
        window.location.reload()
        return
      }

      if (isDev) return

      const isRefreshShortcut =
        event.key === 'F5' || (event.ctrlKey && (event.key === 'r' || event.key === 'R'))

      if (isRefreshShortcut) {
        event.preventDefault()
      }
    },
    [isDev],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])

  const handleContextMenu = useCallback(
    async (event: MouseEvent) => {
      event.preventDefault()
      // Right-clicking the open menu itself does nothing, as with a native menu
      if (event.target instanceof Element && event.target.closest(`[${CONTEXT_MENU_ATTR}]`)) return

      const { x, y } = menuPosition(event)
      const openMenu = useContextMenuStore.getState().open

      const gameCardTarget = findGameCardTarget(resolveTarget(event))
      const account = useSessionStore.getState().account
      if (gameCardTarget && account) {
        try {
          openMenu(x, y, await buildGameCardMenu({ ...gameCardTarget, account, t }))
        } catch (error) {
          console.error('Error in (buildGameCardMenu):', error)
        }
        return
      }

      // Read now, not when an item is picked: opening the menu moves focus into it
      const selectedText = window.getSelection()?.toString() ?? ''
      const activeElement = document.activeElement
      const pasteTarget =
        activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement
          ? activeElement
          : null

      openMenu(x, y, [
        {
          kind: 'item',
          id: 'copy',
          label: t('common.actions.copy'),
          icon: TbCopy,
          isDisabled: !selectedText,
          onAction: () =>
            writeText(selectedText).catch(error => console.error('Error in (writeText):', error)),
        },
        {
          kind: 'item',
          id: 'paste',
          label: t('common.actions.paste'),
          icon: TbClipboard,
          isDisabled: !pasteTarget,
          onAction: async () => {
            if (!pasteTarget) return
            try {
              const text = await readText()
              if (!text) return

              const start = pasteTarget.selectionStart ?? pasteTarget.value.length
              const end = pasteTarget.selectionEnd ?? pasteTarget.value.length
              const newValue =
                pasteTarget.value.slice(0, start) + text + pasteTarget.value.slice(end)

              // React's controlled inputs track value changes through their own synthetic
              // setter, so writing `target.value` directly doesn't trigger a re-render - go
              // through the native prototype setter and dispatch a real `input` event so
              // React picks up the change, matching what a real keyboard paste does.
              const proto =
                pasteTarget instanceof HTMLTextAreaElement
                  ? window.HTMLTextAreaElement.prototype
                  : window.HTMLInputElement.prototype
              const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
              nativeSetter?.call(pasteTarget, newValue)
              pasteTarget.focus()
              pasteTarget.selectionStart = pasteTarget.selectionEnd = start + text.length
              pasteTarget.dispatchEvent(new Event('input', { bubbles: true }))
            } catch (error) {
              console.error('Error in (readText):', error)
            }
          },
        },
      ])
    },
    [t],
  )

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [handleContextMenu])
}
