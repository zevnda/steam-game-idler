import type { ReactNode } from 'react'
import { Typography } from '@heroui/react'

interface FloatingActionBarProps {
  icon: ReactNode
  label: string
  children: ReactNode
}

// The contextual action bar both panes show while something is pending: selected achievements
// (AchievementsView.tsx - staged to flip) and unsaved statistic edits (StatisticsView.tsx -
// "Save changes"). Deliberately *unlike* a list row so it can't be mistaken for one - an earlier
// version was a full-width bordered card sitting at the end of the list and read as just another
// achievement. This one is a centered pill floating over the list (render it inside a `relative`
// pane), with a heavy shadow, an accent outline/glow and a leading accent icon, and it slides up
// as it appears (`floating-action-bar-enter` in globals.css) - the same contextual-toolbar pattern
// photo/mail apps use for "N selected". Panes give their list extra bottom padding while it's
// shown so it never permanently covers the last rows.
export const FloatingActionBar = ({ icon, label, children }: FloatingActionBarProps) => (
  // Full-width, click-through positioning layer; only the pill itself takes pointer events.
  <div className='pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-6'>
    <div
      aria-label={label}
      className='floating-action-bar-enter pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-full border border-accent/60 bg-surface-secondary py-2 pr-2 pl-2 shadow-2xl ring-4 shadow-black/50 ring-accent/15'
      role='toolbar'
    >
      <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-white'>
        {icon}
      </span>
      <Typography className='px-1.5 whitespace-nowrap' type='body-sm' weight='semibold'>
        {label}
      </Typography>
      <span aria-hidden className='mx-1 h-6 w-px bg-border' />
      {children}
    </div>
  </div>
)
