import type { TimeInputValue } from '@heroui/react'

export function isWithinSchedule(from: TimeInputValue, to: TimeInputValue) {
  try {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const fromMinutes = (from?.hour ?? 0) * 60 + (from?.minute ?? 0)
    const toMinutes = (to?.hour ?? 0) * 60 + (to?.minute ?? 0)

    if (fromMinutes <= toMinutes) {
      return currentMinutes >= fromMinutes && currentMinutes < toMinutes
    } else {
      return currentMinutes >= fromMinutes || currentMinutes < toMinutes
    }
  } catch {
    return true
  }
}
