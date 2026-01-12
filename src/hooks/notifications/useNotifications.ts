import type { Dispatch, RefObject, SetStateAction } from 'react'

import { open } from '@tauri-apps/plugin-shell'

import { useEffect, useRef, useState } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  timestamp: number | string | Date
  url: string
  seen: boolean
}

interface NotificationHook {
  notifications: Notification[]
  showNotifications: boolean
  setShowNotifications: Dispatch<SetStateAction<boolean>>
  unseenNotifications: Notification[]
  setUnseenNotifications: Dispatch<SetStateAction<Notification[]>>
  dropdownRef: RefObject<HTMLDivElement | null>
}

export const useNotifications = (): NotificationHook => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unseenNotifications, setUnseenNotifications] = useState<Notification[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch notifications
    fetchNotifications(setNotifications, setUnseenNotifications)
    const interval = setInterval(() => fetchNotifications(setNotifications, setUnseenNotifications), 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Close notification pabnel when clicking outside
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
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

// Fetch notifications and update state
export const fetchNotifications = async (
  setNotifications: Dispatch<SetStateAction<Notification[]>>,
  setUnseenNotifications: Dispatch<SetStateAction<Notification[]>>,
): Promise<void> => {
  const cooldownTimestamp = localStorage.getItem('notificationsCooldown')
  const now = new Date().getTime()

  // Check if cooldown is active and use cached notifications if it is
  if (cooldownTimestamp && now < Number(cooldownTimestamp)) {
    const cachedNotificationsStr = localStorage.getItem('cachedNotifications')
    const cachedNotifications: Notification[] = cachedNotificationsStr ? JSON.parse(cachedNotificationsStr) : []
    setNotifications(cachedNotifications)
    await checkUnseenNotifications(cachedNotifications, setUnseenNotifications)
    return
  }

  try {
    // Fetch notifications
    const response = await fetch(
      'https://raw.githubusercontent.com/Autapomorph/steam-game-idler/refs/heads/main/notifications.json',
    )
    const data: Notification[] = await response.json()
    const LimitNotifications = data.slice(0, 10)
    setNotifications(LimitNotifications)
    await checkUnseenNotifications(LimitNotifications, setUnseenNotifications)
    // Cache notifications and set cooldown timestamp
    localStorage.setItem('cachedNotifications', JSON.stringify(LimitNotifications))
    localStorage.setItem('notificationsCooldown', String(now + 30 * 60 * 1000))
  } catch (error) {
    console.error('Error fetching notifications:', error)
  }
}

// Check for unseen notifications
export const checkUnseenNotifications = async (
  notifications: Notification[],
  setUnseenNotifications: Dispatch<SetStateAction<Notification[]>>,
): Promise<void> => {
  const seenNotificationsStr = localStorage.getItem('seenNotifications')
  const seenNotifications: string[] = seenNotificationsStr ? JSON.parse(seenNotificationsStr) : []
  const unseen = notifications.filter(notification => !seenNotifications.includes(notification.id))
  setUnseenNotifications(unseen)
}

// Mark a notification as seen
export const markAsSeen = (
  id: string,
  unseenNotifications: Notification[],
  setUnseenNotifications: Dispatch<SetStateAction<Notification[]>>,
): void => {
  const seenNotificationsStr = localStorage.getItem('seenNotifications')
  const seenNotifications: string[] = seenNotificationsStr ? JSON.parse(seenNotificationsStr) : []
  if (!seenNotifications.includes(id)) {
    seenNotifications.push(id)
    localStorage.setItem('seenNotifications', JSON.stringify(seenNotifications))
  }
  setUnseenNotifications(unseenNotifications.filter(notification => notification.id !== id))
}

// Mark all notifications as seen
export const markAllAsSeen = (
  notifications: Notification[],
  setUnseenNotifications: Dispatch<SetStateAction<Notification[]>>,
): void => {
  const seenNotificationsStr = localStorage.getItem('seenNotifications')
  const seenNotifications: string[] = seenNotificationsStr ? JSON.parse(seenNotificationsStr) : []
  notifications.forEach(notification => {
    if (!seenNotifications.includes(notification.id)) {
      if (seenNotifications.length >= 10) {
        seenNotifications.shift()
      }
      seenNotifications.push(notification.id)
    }
  })
  localStorage.setItem('seenNotifications', JSON.stringify(seenNotifications))
  setUnseenNotifications([])
}

// Handle opening a URL and marking the notification as seen
export const handleOpenUrl = async (
  url: string,
  id: string,
  unseenNotifications: Notification[],
  setUnseenNotifications: Dispatch<SetStateAction<Notification[]>>,
): Promise<void> => {
  markAsSeen(id, unseenNotifications, setUnseenNotifications)
  try {
    await open(url)
  } catch (error) {
    console.error('Failed to open link:', error)
  }
}

// Convert timestamp to relative time
export const timeAgo = (timestamp: number): string => {
  const now = new Date()
  const secondsPast = Math.floor(now.getTime() / 1000 - timestamp)

  if (secondsPast < 60) {
    return `${secondsPast}s`
  }
  if (secondsPast < 3600) {
    return `${Math.floor(secondsPast / 60)}m`
  }
  if (secondsPast < 86400) {
    return `${Math.floor(secondsPast / 3600)}h`
  }
  if (secondsPast < 2592000) {
    return `${Math.floor(secondsPast / 86400)}d`
  }
  if (secondsPast < 31536000) {
    return `${Math.floor(secondsPast / 2592000)}mo`
  }
  return `${Math.floor(secondsPast / 31536000)}y`
}
