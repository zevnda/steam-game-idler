import type { ComponentType } from 'react'
import { cn } from '@heroui/react'
import Link from 'next/link'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useIsActiveRoute } from '@/shared/hooks/useIsActiveRoute'

interface SidebarItemProps {
  href: string
  icon: ComponentType<{ fontSize?: number; className?: string }>
  label: string
  // Driven by whichever store the caller wires up (idling/card farming today - see Sidebar.tsx's
  // `pulseWhenIdling`/`pulseWhenFarming`) - a plain `<a>` rendered by next/link, so state is native
  // `focus-visible:`, not react-aria-components' `data-focus-visible:` (see AccountOption.tsx for
  // that distinction).
  pulsing?: boolean
  // Driven by `sidebarStore` (Ctrl+W, see useDashboardShortcuts.ts) - icon-only rendering with the
  // label moved into a hover tooltip instead of hidden entirely, so a collapsed sidebar stays
  // navigable/identifiable without needing to expand it first.
  collapsed?: boolean
  // Driven by Sidebar.tsx's `goldWhenClaimable` (free games only) - just the icon goes gold, the
  // label/active-state styling is untouched, so this doesn't compete with `isActive`/`pulsing`.
  iconHighlighted?: boolean
}

// One sidebar nav entry. Active state comes from `useIsActiveRoute`, not a navigationStore.
export const SidebarItem = ({
  href,
  icon: Icon,
  label,
  pulsing = false,
  collapsed = false,
  iconHighlighted = false,
}: SidebarItemProps) => {
  const isActive = useIsActiveRoute(href)

  const link = (
    <Link
      aria-label={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-focus',
        collapsed && 'justify-center px-0',
        isActive ? 'bg-surface hover:bg-surface-hover' : 'text-foreground hover:bg-surface-hover',
        pulsing && 'animate-pulse text-accent',
      )}
      href={href}
    >
      <Icon className={cn('shrink-0', iconHighlighted && 'text-[#ffc700]')} fontSize={18} />
      {!collapsed && <span className='truncate'>{label}</span>}
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
