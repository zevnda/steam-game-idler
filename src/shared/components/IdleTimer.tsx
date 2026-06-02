import { useEffect, useState } from 'react'
import { TbPlayerPlayFilled } from 'react-icons/tb'
import { cn } from '@heroui/react'

function formatTime(elapsed: number) {
  const h = Math.floor(elapsed / 3600000)
  const m = Math.floor((elapsed % 3600000) / 60000)
  const s = Math.floor((elapsed % 60000) / 1000)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function IdleTimer({ startTime }: { startTime: number }) {
  const [, tick] = useState({})

  useEffect(() => {
    const id = setInterval(() => tick({}), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className={cn(
        'absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/70 pl-1 pr-2 py-px rounded-md text-xs',
      )}
    >
      <TbPlayerPlayFilled size={14} />
      {formatTime(Date.now() - startTime)}
    </div>
  )
}
