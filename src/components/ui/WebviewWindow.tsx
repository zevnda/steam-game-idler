import type { MouseEvent, ReactElement, ReactNode } from 'react'

import { Webview } from '@tauri-apps/api/webview'
import { LogicalPosition, LogicalSize, Window } from '@tauri-apps/api/window'

interface ExtLinkProps {
  children: ReactNode
  href: string
  className?: string
}

export default function WebviewWindow({ children, href, className = '' }: ExtLinkProps): ReactElement {
  const handleClick = async (e: MouseEvent<HTMLAnchorElement>): Promise<void> => {
    e.preventDefault()
    try {
      const appWindow = new Window('ext-link')

      const parseHref =
        process.env.NODE_ENV === 'development'
          ? href.replace('https://steamgameidler.com', 'http://localhost:3001')
          : href

      appWindow.once('tauri://created', async function () {
        appWindow.setTitle(`Steam Game Idler - ${parseHref}`)
        appWindow.setPosition(new LogicalPosition(10, 10))
        appWindow.setSize(new LogicalSize(1500, 825))
        appWindow.setResizable(false)
        appWindow.setFullscreen(false)
        appWindow.setMaximizable(false)
        appWindow.setDecorations(true)
        appWindow.setShadow(true)

        new Webview(appWindow, 'ext-link', {
          url: parseHref,
          x: 0,
          y: 0,
          width: 1500,
          height: 825,
          acceptFirstMouse: true,
          devtools: true,
          focus: true,
          transparent: false,
        })
      })
    } catch (error) {
      console.error('Failed to open link:', error)
    }
  }

  return (
    <a className={`w-fit h-fit cursor-pointer ${className}`} href={href} onClick={handleClick}>
      {children}
    </a>
  )
}
