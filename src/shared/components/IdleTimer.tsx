import { useEffect, useState } from 'react'
import { TbPlayerPlayFilled } from 'react-icons/tb'

interface IdleTimerProps {
  startTime: number
}

const formatElapsed = (elapsedMs: number) => {
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60))
  const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)
  const pad = (n: number, width: number) => String(n).padStart(width, '0')

  if (hours <= 0) {
    return `${pad(minutes, 2)}:${pad(seconds, 2)}`
  }
  // Widens past the usual 1-digit hour count only once it actually matters, rather than always
  // reserving 2-3 digits of space.
  const hourWidth = hours >= 100 ? 3 : hours >= 10 ? 2 : 1
  return `${pad(hours, hourWidth)}:${pad(minutes, 2)}:${pad(seconds, 2)}`
}

// Elapsed-time badge for a currently-idling game card. `startTime` is a frontend-only timestamp
// (see idlingStore) - neither backend reports when idling actually started, only what's currently
// idling, so this can only ever measure "since this session last observed it idling," not true
// wall-clock idle duration across app restarts.
export const IdleTimer = ({ startTime }: IdleTimerProps) => {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => forceUpdate(n => n + 1), 1000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className='absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/70 py-px pr-2 pl-1 text-xs text-white'>
      <TbPlayerPlayFilled size={14} />
      {formatElapsed(Date.now() - startTime)}
    </div>
  )
}
