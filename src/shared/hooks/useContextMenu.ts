import { Menu, MenuItem } from '@tauri-apps/api/menu'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
// way to be copied at all. Skipped in dev, where refreshing to pick up changes is expected;
// Ctrl+Alt+Shift+F5 still force-reloads regardless, for recovering a genuinely stuck window without
// relaunching the app. Right-clicking a game card anywhere (games list, favorites,
// achievement-unlocker, auto-idle, card-farming - any component whose root carries
// gameCardContext.ts's data attributes) instead pops a game-specific menu built by
// buildGameCardMenu.ts, since that's a fundamentally different action set than the
// window-wide Copy/Paste fallback below.
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

      const gameCardTarget = findGameCardTarget(event.target)
      const account = useSessionStore.getState().account
      if (gameCardTarget && account) {
        try {
          const menu = await Menu.new({
            items: await buildGameCardMenu({ ...gameCardTarget, account, t }),
          })
          await menu.popup()
        } catch (error) {
          console.error('Error in (game card context menu popup):', error)
        }
        return
      }

      const hasSelection = !!window.getSelection()?.toString()
      const activeElement = document.activeElement
      const canPaste =
        activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement

      try {
        const menu = await Menu.new({
          items: [
            await MenuItem.new({
              id: 'copy',
              text: t('common.actions.copy'),
              enabled: hasSelection,
              action: () => {
                const selectedText = window.getSelection()?.toString()
                if (!selectedText) return
                writeText(selectedText).catch(error =>
                  console.error('Error in (writeText):', error),
                )
              },
            }),
            await MenuItem.new({
              id: 'paste',
              text: t('common.actions.paste'),
              enabled: canPaste,
              action: async () => {
                try {
                  const text = await readText()
                  const target = document.activeElement
                  if (
                    !text ||
                    (!(target instanceof HTMLInputElement) &&
                      !(target instanceof HTMLTextAreaElement))
                  ) {
                    return
                  }

                  const start = target.selectionStart ?? target.value.length
                  const end = target.selectionEnd ?? target.value.length
                  const newValue = target.value.slice(0, start) + text + target.value.slice(end)

                  // React's controlled inputs track value changes through their own synthetic
                  // setter, so writing `target.value` directly doesn't trigger a re-render - go
                  // through the native prototype setter and dispatch a real `input` event so
                  // React picks up the change, matching what a real keyboard paste does.
                  const proto =
                    target instanceof HTMLTextAreaElement
                      ? window.HTMLTextAreaElement.prototype
                      : window.HTMLInputElement.prototype
                  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
                  nativeSetter?.call(target, newValue)
                  target.selectionStart = target.selectionEnd = start + text.length
                  target.dispatchEvent(new Event('input', { bubbles: true }))
                } catch (error) {
                  console.error('Error in (readText):', error)
                }
              },
            }),
          ],
        })

        await menu.popup()
      } catch (error) {
        console.error('Error in (context menu popup):', error)
      }
    },
    [t],
  )

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [handleContextMenu])
}
