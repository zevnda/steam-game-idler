import type { ReactNode } from 'react'
import { cn } from '@heroui/react'

interface PageToolbarProps {
  // The page's tabs, which stay on screen in every state, disabled when they can't be used. A page
  // without tabs passes a `PageTitle` instead, but only while it has a list to label: a title that
  // shows during loading and then vanishes on an empty page is worse than no title.
  start?: ReactNode
  // Controls, in the same order on every page so they're always where users expect: anything
  // specific to the current tab first (sort, clear), then page-wide tools (refresh, manual add,
  // settings), with the page's main action (start/stop) last, at the far right. Controls stay in
  // place and go disabled rather than disappearing, so the row looks the same in every state.
  children?: ReactNode
  // False for the Games list's toolbar, which gets its background once it sticks (see GamesList.tsx).
  // Until then nothing passes behind it, so one would only show up against a custom background.
  hasBackground?: boolean
}

// The one bar of controls above each page's content, replacing the old two-line page headers: the
// sidebar already says which page is open, so a large title only took space from the games below.
//
// Scrolling content passes underneath, so it scrolls the full height of the page: `.page-toolbar`
// cancels its own height in the layout, and whatever sits below reserves that space again as scroll
// padding (`.page-content`, or `.page-toolbar-offset` on the virtualized grids). See globals.css.
//
// `flex-wrap` on both sides: in a longer locale at the minimum window width the controls drop below
// the tabs and wrap among themselves instead of overflowing. It's a no-op wherever everything fits,
// and a taller bar still can't cover content, since only its usual height is cancelled.
export const PageToolbar = ({ start, children, hasBackground = true }: PageToolbarProps) => (
  <div
    className={cn(
      'page-toolbar flex min-h-17 shrink-0 flex-wrap items-center justify-between gap-3 px-6 py-3.5',
      hasBackground && 'page-toolbar-solid',
    )}
  >
    {start}
    {children && (
      <div className='ml-auto flex flex-wrap items-center justify-end gap-2'>{children}</div>
    )}
  </div>
)

export const CountChip = ({ count }: { count: number }) => (
  <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-secondary px-1.5 text-xs font-semibold tabular-nums text-muted'>
    {count.toLocaleString()}
  </span>
)

interface PageTitleProps {
  title: string
  count: number
}

export const PageTitle = ({ title, count }: PageTitleProps) => (
  <div className='flex min-h-10 items-center gap-2'>
    <h2 className='text-lg font-bold'>{title}</h2>
    <CountChip count={count} />
  </div>
)
