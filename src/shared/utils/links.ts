import { openUrl } from '@tauri-apps/plugin-opener'

// Every titlebar/menu/notification external link goes through this rather than calling `openUrl`
// directly, so a failure (no default browser registered, malformed URL) degrades to a console
// error instead of an unhandled rejection surfacing as a crash toast.
export async function openExternalLink(href: string) {
  try {
    await openUrl(href)
  } catch (error) {
    console.error('Error in (openExternalLink):', error)
  }
}
