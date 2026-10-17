import { cn } from '@heroui/react'

interface ProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  label: string
}

// The sidebar's at-a-glance completion readout (AchievementManagerSidebar.tsx). A plain SVG ring
// rather than HeroUI's ProgressBar - a ring reads as "completion" in a fixed square footprint next
// to the game's art, where a bar would need the full sidebar width. Turns amber at 100%, matching
// the trophy readout the old toolbar used for the same "fully completed" flourish.
export const ProgressRing = ({
  value,
  max,
  size = 72,
  strokeWidth = 6,
  label,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = max > 0 ? Math.min(1, value / max) : 0
  const isComplete = max > 0 && value >= max

  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={value}
      className='relative shrink-0'
      role='progressbar'
      style={{ width: size, height: size }}
    >
      <svg className='-rotate-90' height={size} width={size}>
        <circle
          className='stroke-surface-tertiary'
          cx={size / 2}
          cy={size / 2}
          fill='none'
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={cn('duration-500', isComplete ? 'stroke-amber-400' : 'stroke-accent')}
          cx={size / 2}
          cy={size / 2}
          fill='none'
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          strokeLinecap='round'
          strokeWidth={strokeWidth}
        />
      </svg>
      <span className='absolute inset-0 flex items-center justify-center text-sm font-bold'>
        {Math.round(fraction * 100)}%
      </span>
    </div>
  )
}
