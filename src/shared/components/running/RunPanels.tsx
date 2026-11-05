import type { ReactNode } from 'react'
import { cn, ProgressBar } from '@heroui/react'

// The building blocks both running screens (Card Farming, Achievement Unlocker) share, so the two
// look like one design while each shows its own numbers. All of them assume an `@container`
// ancestor (RunScreen provides it) for their small-window layouts.

// A titled card, the container for each list on a running screen
export const RunSection = ({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) => (
  <section
    className={cn(
      'flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4',
      className,
    )}
  >
    {title && <h3 className='font-bold'>{title}</h3>}
    {children}
  </section>
)

interface RunSummaryProps {
  doneLabel: string
  done: number
  leftLabel: string
  left: number
  // e.g. "6 of 24 cards"
  progressText: string
}

// The strip under the Overview's banner: what's been done this session, what's left, and a bar for
// the whole session. The bar drops onto its own line in a small window.
export const RunSummary = ({ doneLabel, done, leftLabel, left, progressText }: RunSummaryProps) => {
  const total = done + left
  return (
    <div className='flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-border bg-surface px-5 py-4'>
      <SummaryFigure label={doneLabel} value={done} valueClassName='text-success' />
      <div className='w-px self-stretch bg-border' />
      <SummaryFigure label={leftLabel} value={left} />
      <div className='w-px self-stretch bg-border @max-3xl:hidden' />
      <div className='flex min-w-56 flex-1 flex-col gap-2 @max-3xl:basis-full'>
        <span className='self-end text-xs tabular-nums text-muted'>{progressText}</span>
        <ProgressBar
          aria-label={progressText}
          color='success'
          maxValue={Math.max(total, 1)}
          minValue={0}
          value={done}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </div>
  )
}

const SummaryFigure = ({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: number
  valueClassName?: string
}) => (
  <div className='flex flex-col gap-0.5'>
    <span className='text-xs font-semibold text-muted'>{label}</span>
    <span className={cn('text-2xl font-extrabold tabular-nums', valueClassName)}>
      {value.toLocaleString()}
    </span>
  </div>
)

// The Details tab's headline numbers: a label and a value, nothing else
export const StatTiles = ({ children }: { children: ReactNode }) => (
  <div className='grid grid-cols-3 gap-4 @max-3xl:grid-cols-2'>{children}</div>
)

export const StatTile = ({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: ReactNode
  valueClassName?: string
}) => (
  <div className='flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border bg-surface px-5 py-4'>
    <span className='truncate text-xs font-semibold text-muted'>{label}</span>
    <span className={cn('text-3xl font-extrabold tabular-nums', valueClassName)}>{value}</span>
  </div>
)

// A circular progress indicator with content in the middle
export const ProgressRing = ({
  value,
  max,
  size,
  stroke,
  color = 'var(--accent)',
  label,
  children,
}: {
  value: number
  max: number
  size: number
  stroke: number
  color?: string
  label: string
  children?: ReactNode
}) => {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = max > 0 ? Math.min(1, value / max) : 0
  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={value}
      className='relative grid shrink-0 place-items-center'
      role='progressbar'
      style={{ width: size, height: size }}
    >
      <svg className='absolute inset-0 -rotate-90' height={size} width={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          fill='none'
          r={radius}
          stroke='var(--default)'
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill='none'
          r={radius}
          stroke={color}
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          strokeLinecap='round'
          strokeWidth={stroke}
        />
      </svg>
      <div className='relative text-center leading-tight'>{children}</div>
    </div>
  )
}
