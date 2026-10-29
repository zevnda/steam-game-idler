import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@heroui/react'
import Link from 'next/link'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useIsActiveRoute } from '@/shared/hooks/useIsActiveRoute'
import { revealTitleIfTruncated } from '@/shared/utils/revealTitleIfTruncated'

interface SidebarItemProps {
  href: string
  icon: ComponentType<{ fontSize?: number; className?: string; strokeWidth?: number }>
  label: string
  // Driven by whichever store the caller wires up (idling/card farming/achievement unlocker - see
  // Sidebar.tsx's `runningWhen*` flags). Expanded: a small live-status dot (`RunningDot`) at the
  // row's end, not a recolour/animation of the whole row - see that component's comment for why.
  // Collapsed: the icon alone pulses in the accent colour instead (see the Icon's own comment). A plain `<a>`
  // rendered by next/link, so state is native `focus-visible:`, not react-aria-components'
  // `data-focus-visible:` (see AccountOption.tsx for that distinction).
  running?: boolean
  // Driven by `sidebarStore` (Ctrl+W, see useDashboardShortcuts.ts) - icon-only rendering with the
  // label moved into a hover tooltip instead of hidden entirely, so a collapsed sidebar stays
  // navigable/identifiable without needing to expand it first.
  collapsed?: boolean
  // Driven by Sidebar.tsx's `goldWhenClaimable` (free games only) - just the icon goes gold, the
  // label/active-state styling is untouched, so this doesn't compete with `isActive`/`running`.
  iconHighlighted?: boolean
}

// Live-status marker for a feature that's currently running. A small accent dot with a slow,
// soft ping ring - deliberately not a pulse of the whole row: a pulsing label is harder to read,
// competes for attention even when the user isn't looking for it, and overrode the row's own
// muted/active colouring. The ring is `motion-safe:` only, so reduced-motion users get a static
// dot. Its 2s duration is an inline style (not a class) so it reliably overrides `animate-ping`'s
// own 1s shorthand regardless of stylesheet order - the stock 1s ping reads as urgent/alarming
// for something that just runs quietly for hours.
const RunningDot = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn('relative flex size-1.5 shrink-0', className)}>
    <span
      className='absolute inline-flex size-full rounded-full bg-accent opacity-60 motion-safe:animate-ping'
      style={{ animationDuration: '2s' }}
    />
    <span className='relative inline-flex size-1.5 rounded-full bg-accent' />
  </span>
)

// One sidebar nav entry. Active state comes from `useIsActiveRoute`, not a navigationStore.
//
// Visual hierarchy: inactive items are muted (icon + label) and only go full `text-foreground` on
// hover or when active, so the active page reads at a glance instead of every row competing at full
// brightness. Icons render at a 1.5 stroke (Tabler's default is 2) so their line weight matches the
// 14px label instead of reading bolder than the text beside it. Labels are `font-semibold` rather
// than medium - in the muted inactive colour, medium starts to look washed out, while semibold
// stays crisp.
export const SidebarItem = ({
  href,
  icon: Icon,
  label,
  running = false,
  collapsed = false,
  iconHighlighted = false,
}: SidebarItemProps) => {
  const { t } = useTranslation()
  const isActive = useIsActiveRoute(href)
  const runningLabel = t('common.status.running')

  const link = (
    <Link
      // Collapsed rows have no visible label, so the accessible name carries the running state
      // too; expanded rows get it from the `sr-only` span below instead.
      aria-label={collapsed ? (running ? `${label}, ${runningLabel}` : label) : undefined}
      className={cn(
        // Fixed `h-9` rather than `py-2` - with padding alone the row's height came from its
        // content, so a collapsed (icon-only, 18px) row was 2px shorter than an expanded one (20px
        // label line-height), and the whole list visibly shifted on every collapse/expand.
        'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-semibold outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-focus',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-surface text-foreground hover:bg-surface-hover'
          : 'text-muted hover:bg-surface-hover hover:text-foreground',
      )}
      href={href}
    >
      <Icon
        // Collapsed + running: no room for the dot beside a lone icon, so the icon itself carries
        // the signal instead - accent colour plus `animate-pulse` (a 2s opacity breathe, the same
        // cadence as the dot's ping). Otherwise no colour of its own (inherits the link's
        // muted/foreground) unless gold-highlighted. Branches are mutually exclusive since two
        // `text-*` classes on one element resolve by stylesheet order, not class order.
        className={cn(
          'shrink-0',
          collapsed && running
            ? 'text-accent motion-safe:animate-pulse'
            : iconHighlighted && 'text-[#ffc700]',
        )}
        fontSize={18}
        strokeWidth={1.5}
      />
      {!collapsed && (
        <>
          <span className='truncate' onMouseEnter={revealTitleIfTruncated}>
            {label}
          </span>
          {running && (
            <>
              <RunningDot className='ml-auto' />
              <span className='sr-only'>{runningLabel}</span>
            </>
          )}
        </>
      )}
    </Link>
  )

  if (!collapsed) return link

  return (
    <AppTooltip.Root delay={300}>
      <AppTooltip.Trigger>{link}</AppTooltip.Trigger>
      <AppTooltip.Content placement='right'>{label}</AppTooltip.Content>
    </AppTooltip.Root>
  )
}
