import { useEffect, useState } from 'react'
import { openExternalLink } from '@/shared/utils/links'

export interface AppNotification {
  id: string
  title: string
  message: string
  timestamp: number | string | Date
  url: string
}

const COOLDOWN_KEY = 'notificationsCooldown'
const CACHE_KEY = 'cachedNotifications'
const SEEN_KEY = 'seenNotifications'
const COOLDOWN_MS = 30 * 60 * 1000
const REFRESH_MS = 60 * 60 * 1000
const MAX_NOTIFICATIONS = 10
const MAX_SEEN_TRACKED = 10

function readSeenIds() {
  const raw = localStorage.getItem(SEEN_KEY)
  return raw ? (JSON.parse(raw) as string[]) : []
}

function unseenOf(notifications: AppNotification[]) {
  const seen = readSeenIds()
  return notifications.filter(notification => !seen.includes(notification.id))
}

async function fetchNotifications() {
  const cooldown = localStorage.getItem(COOLDOWN_KEY)
  const now = Date.now()

  if (cooldown && now < Number(cooldown)) {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? (JSON.parse(cached) as AppNotification[]) : []
  }

  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/notifications.json',
    )
    const data: AppNotification[] = await response.json()
    const limited = data.slice(0, MAX_NOTIFICATIONS)
    localStorage.setItem(CACHE_KEY, JSON.stringify(limited))
    localStorage.setItem(COOLDOWN_KEY, String(now + COOLDOWN_MS))
    return limited
  } catch (error) {
    console.error('Error in (fetchNotifications):', error)
    return []
  }
}

// Fetches a small remote notifications feed (30-minute localStorage cooldown/cache) and tracks
// which ones the user has already seen - mirrors `main`'s equivalent exactly, no Tauri command or
// tier gating involved, just fetch + localStorage.
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unseen, setUnseen] = useState<AppNotification[]>([])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const fetched = await fetchNotifications()
      if (!isMounted) return
      setNotifications(fetched)
      setUnseen(unseenOf(fetched))
    }

    load()
    const interval = setInterval(load, REFRESH_MS)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const markSeen = (id: string) => {
    const seen = readSeenIds()
    if (!seen.includes(id)) {
      if (seen.length >= MAX_SEEN_TRACKED) seen.shift()
      seen.push(id)
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
    }
    setUnseen(current => current.filter(notification => notification.id !== id))
  }

  const markAllSeen = () => {
    const seen = readSeenIds()
    for (const notification of notifications) {
      if (!seen.includes(notification.id)) {
        if (seen.length >= MAX_SEEN_TRACKED) seen.shift()
        seen.push(notification.id)
      }
    }
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
    setUnseen([])
  }

  const openNotification = async (notification: AppNotification) => {
    markSeen(notification.id)
    await openExternalLink(notification.url)
  }

  return { notifications, unseen, markAllSeen, openNotification }
}

export function timeAgo(timestamp: number) {
  const secondsPast = Math.floor(Date.now() / 1000 - timestamp)

  if (secondsPast < 60) return `${secondsPast}s`
  if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)}m`
  if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)}h`
  if (secondsPast < 2592000) return `${Math.floor(secondsPast / 86400)}d`
  if (secondsPast < 31536000) return `${Math.floor(secondsPast / 2592000)}mo`
  return `${Math.floor(secondsPast / 31536000)}y`
}
