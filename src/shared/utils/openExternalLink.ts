import { openUrl } from '@tauri-apps/plugin-opener'

export async function openExternalLink(url: string) {
  try {
    await openUrl(url)
  } catch (error) {
    console.error('Failed to open external link:', error)
  }
}
