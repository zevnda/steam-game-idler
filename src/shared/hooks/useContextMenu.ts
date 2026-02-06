import { invoke } from '@tauri-apps/api/core'
import { Menu, MenuItem } from '@tauri-apps/api/menu'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useEffect } from 'react'

export function useContextMenu() {
  // Disable context menu and refresh actions
  useEffect(() => {
    const disableContextMenuAndRefresh = async () => {
      const isDev = await invoke<boolean>('is_dev')
      if (!isDev) {
        document.addEventListener('contextmenu', event => event.preventDefault())

        document.addEventListener('keydown', function (event) {
          if (event.key === 'F5') {
            event.preventDefault()
          }

          if (event.ctrlKey && (event.key === 'r' || event.key === 'R')) {
            event.preventDefault()
          }

          if (event.ctrlKey && event.shiftKey && (event.key === 'R' || event.key === 'r')) {
            event.preventDefault()
          }

          if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'F5') {
            this.location.reload()
          }
        })
      }
    }
    disableContextMenuAndRefresh()
  }, [])

  // Create the context menu once on mount
  useEffect(() => {
    const handleGlobalContextMenu = async (e: MouseEvent) => {
      e.preventDefault()

      try {
        const hasSelection = !!window.getSelection()?.toString()
        const activeElement = document.activeElement
        const canPaste =
          activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement

        // Create menu dynamically based on current state
        const menu = await Menu.new({
          items: [
            await MenuItem.new({
              id: 'copy',
              text: 'Copy',
              enabled: hasSelection,
              action: async () => {
                try {
                  const selectedText = window.getSelection()?.toString()
                  if (selectedText) {
                    await writeText(selectedText)
                  }
                } catch (error) {
                  console.error('Copy failed:', error)
                }
              },
            }),
            await MenuItem.new({
              id: 'paste',
              text: 'Paste',
              enabled: canPaste,
              action: async () => {
                try {
                  const text = await readText()
                  if (text) {
                    // Insert text at cursor pos of input/textarea
                    const activeElement = document.activeElement
                    if (
                      activeElement instanceof HTMLInputElement ||
                      activeElement instanceof HTMLTextAreaElement
                    ) {
                      const start = activeElement.selectionStart || 0
                      const end = activeElement.selectionEnd || 0
                      const currentValue = activeElement.value
                      const newValue =
                        currentValue.substring(0, start) + text + currentValue.substring(end)

                      // Ensure setter works properly for React controlled inputs
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype,
                        'value',
                      )?.set

                      if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(activeElement, newValue)
                      }

                      // Set cursor pos
                      activeElement.selectionStart = activeElement.selectionEnd =
                        start + text.length

                      // Trigger both input chaneg events
                      const inputEvent = new Event('input', { bubbles: true })
                      const changeEvent = new Event('change', { bubbles: true })
                      activeElement.dispatchEvent(inputEvent)
                      activeElement.dispatchEvent(changeEvent)
                    }
                  }
                } catch (error) {
                  console.error('Paste failed:', error)
                }
              },
            }),
          ],
        })

        await menu.popup()
      } catch (error) {
        console.error('Error showing context menu:', error)
      }
    }

    document.addEventListener('contextmenu', handleGlobalContextMenu)

    return () => {
      document.removeEventListener('contextmenu', handleGlobalContextMenu)
    }
  }, [])
}
