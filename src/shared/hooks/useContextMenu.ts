import { invoke } from '@tauri-apps/api/core'
import { Menu, MenuItem } from '@tauri-apps/api/menu'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useEffect } from 'react'

export function useContextMenu() {
  useEffect(() => {
    const init = async () => {
      const isDev = await invoke<boolean>('is_dev')
      if (!isDev) {
        document.addEventListener('contextmenu', e => e.preventDefault())
        document.addEventListener('keydown', e => {
          if (e.key === 'F5') e.preventDefault()
          if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) e.preventDefault()
          if (e.ctrlKey && e.shiftKey && (e.key === 'R' || e.key === 'r')) e.preventDefault()
        })
      }
    }
    init()
  }, [])

  useEffect(() => {
    const handleContextMenu = async (e: MouseEvent) => {
      e.preventDefault()
      try {
        const hasSelection = !!window.getSelection()?.toString()
        const active = document.activeElement
        const canPaste = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement

        const menu = await Menu.new({
          items: [
            await MenuItem.new({
              id: 'copy',
              text: 'Copy',
              enabled: hasSelection,
              action: async () => {
                const text = window.getSelection()?.toString()
                if (text) await writeText(text)
              },
            }),
            await MenuItem.new({
              id: 'paste',
              text: 'Paste',
              enabled: canPaste,
              action: async () => {
                const text = await readText()
                if (!text) return
                const el = document.activeElement
                if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement))
                  return
                const start = el.selectionStart || 0
                const end = el.selectionEnd || 0
                const newValue = el.value.substring(0, start) + text + el.value.substring(end)
                const setter = Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype,
                  'value',
                )?.set
                setter?.call(el, newValue)
                el.selectionStart = el.selectionEnd = start + text.length
                el.dispatchEvent(new Event('input', { bubbles: true }))
                el.dispatchEvent(new Event('change', { bubbles: true }))
              },
            }),
          ],
        })
        await menu.popup()
      } catch (error) {
        console.error('Error showing context menu:', error)
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])
}
