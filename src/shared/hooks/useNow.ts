import { useEffect, useState } from 'react'

// The current time, re-read every second - for countdowns and elapsed-time displays that the
// backend reports as absolute timestamps rather than re-emitting every tick.
export const useNow = () => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  return now
}
