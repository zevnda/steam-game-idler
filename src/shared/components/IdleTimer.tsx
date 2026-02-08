import { useEffect, useState } from 'react'
import { TbPlayerPlayFilled } from 'react-icons/tb'
import { cn } from '@heroui/react'

export const IdleTimer = ({ startTime }: { startTime: number }) => {
  const formatTime = (elapsed: number) => {
    const hours = Math.floor(elapsed / (1000 * 60 * 60))
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)

    if (hours > 0) {
      // When hours reach 10-99 show 2 digits
      if (hours >= 10 && hours < 100) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
      // When hours reach 100+ show 3 digits
      else if (hours >= 100) {
        return `${String(hours).padStart(3, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
      // For 1-9 hours show 1 digit
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    // Less than 1 hour
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const [, forceUpdate] = useState<Record<string, never>>({})

  useEffect(() => {
    const intervalId = setInterval(() => {
      forceUpdate({})
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  // Calculate time directly in render
  const elapsed = Date.now() - startTime
  const displayTime = formatTime(elapsed)

  return (
    <div
      className={cn(
        'absolute top-1.5 left-1.5 flex items-center gap-1',
        'bg-black/70 pl-1 pr-2 py-px',
        'rounded-md text-xs',
      )}
    >
      <TbPlayerPlayFilled size={14} />
      {displayTime}
    </div>
  )
}
