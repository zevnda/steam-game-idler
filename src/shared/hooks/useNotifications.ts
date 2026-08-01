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

// `short` style + Intl.RelativeTimeFormat rather than hand-translated "m"/"h"/"d" units - CLDR
// supplies each locale's own idiomatic relative-time phrasing (and correct pluralization)
// natively, so this needs no i18next keys/Crowdin work at all. `narrow` style was tried first but
// drops the relational word ("ago"/"назад") for some locales, e.g. Russian renders as a bare
// signed duration ("-12 дн.") that isn't natural Russian - `short` keeps "ago"/its equivalent in
// every locale at the cost of a couple extra characters.
export function timeAgo(timestamp: number, locale: string) {
  const secondsPast = Math.floor(Date.now() / 1000 - timestamp)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'short' })

  if (secondsPast < 60) return rtf.format(-secondsPast, 'second')
  if (secondsPast < 3600) return rtf.format(-Math.floor(secondsPast / 60), 'minute')
  if (secondsPast < 86400) return rtf.format(-Math.floor(secondsPast / 3600), 'hour')
  if (secondsPast < 2592000) return rtf.format(-Math.floor(secondsPast / 86400), 'day')
  if (secondsPast < 31536000) return rtf.format(-Math.floor(secondsPast / 2592000), 'month')
  return rtf.format(-Math.floor(secondsPast / 31536000), 'year')
}
