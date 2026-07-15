import { emit } from '@tauri-apps/api/event'
import { useEffect } from 'react'

// The Rust side starts the window hidden and shows it only once this fires, so the webview's
// blank-then-painted load never flashes as a visible window. Mounted once in `_app.tsx` (the one
// place guaranteed to render on every route) rather than per-page.
export function useAppReady() {
  useEffect(() => {
    emit('ready')
  }, [])
}
