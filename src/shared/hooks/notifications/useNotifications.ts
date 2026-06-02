import { useEffect, useRef, useState } from 'react'
import { openExternalLink } from '@/shared/utils'

interface Notification {
  id: string
  title: string
  message: string
  timestamp: number | string | Date
  url: string
  seen: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unseenNotifications, setUnseenNotifications] = useState<Notification[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications(setNotifications, setUnseenNotifications)
    const id = setInterval(
      () => fetchNotifications(setNotifications, setUnseenNotifications),
      60 * 60 * 1000,
    )
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return {
    notifications,
    showNotifications,
    setShowNotifications,
    unseenNotifications,
    setUnseenNotifications,
    dropdownRef,
  }
}

export async function fetchNotifications(
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setUnseenNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) {
  const cooldown = localStorage.getItem('notificationsCooldown')
  const now = Date.now()

  if (cooldown && now < Number(cooldown)) {
    const cached: Notification[] = JSON.parse(localStorage.getItem('cachedNotifications') || '[]')
    setNotifications(cached)
    checkUnseenNotifications(cached, setUnseenNotifications)
    return
  }

  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/notifications.json',
    )
    const data: Notification[] = await res.json()
    const limited = data.slice(0, 10)
    setNotifications(limited)
    checkUnseenNotifications(limited, setUnseenNotifications)
    localStorage.setItem('cachedNotifications', JSON.stringify(limited))
    localStorage.setItem('notificationsCooldown', String(now + 30 * 60 * 1000))
  } catch (error) {
    console.error('Error fetching notifications:', error)
  }
}

export function checkUnseenNotifications(
  notifications: Notification[],
  setUnseenNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) {
  const seen: string[] = JSON.parse(localStorage.getItem('seenNotifications') || '[]')
  setUnseenNotifications(notifications.filter(n => !seen.includes(n.id)))
}

export function markAsSeen(
  id: string,
  unseenNotifications: Notification[],
  setUnseenNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) {
  const seen: string[] = JSON.parse(localStorage.getItem('seenNotifications') || '[]')
  if (!seen.includes(id)) {
    seen.push(id)
    localStorage.setItem('seenNotifications', JSON.stringify(seen))
  }
  setUnseenNotifications(unseenNotifications.filter(n => n.id !== id))
}

export function markAllAsSeen(
  notifications: Notification[],
  setUnseenNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) {
  const seen: string[] = JSON.parse(localStorage.getItem('seenNotifications') || '[]')
  for (const n of notifications) {
    if (!seen.includes(n.id)) {
      if (seen.length >= 10) seen.shift()
      seen.push(n.id)
    }
  }
  localStorage.setItem('seenNotifications', JSON.stringify(seen))
  setUnseenNotifications([])
}

export async function handleOpenUrl(
  url: string,
  id: string,
  unseenNotifications: Notification[],
  setUnseenNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) {
  markAsSeen(id, unseenNotifications, setUnseenNotifications)
  await openExternalLink(url)
}

export function timeAgo(timestamp: number) {
  const s = Math.floor(Date.now() / 1000 - timestamp)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 2592000) return `${Math.floor(s / 86400)}d`
  if (s < 31536000) return `${Math.floor(s / 2592000)}mo`
  return `${Math.floor(s / 31536000)}y`
}
