import type { ReactNode } from 'react'
import { cn } from '@heroui/react'

interface PageBodyProps {
  // Fill the rest of a flex-column parent (default), for content that manages its own scrolling.
  // False lets the body grow to its content, for a host that itself scrolls.
  fill?: boolean
  children: ReactNode
}

// A routed dashboard page's content, or everything below a settings category's title. It used to
// play its own fade-and-rise on every navigation; that's gone - pages and settings categories now
// crossfade (pageTransition.ts), or switch instantly where that isn't available.
export const PageBody = ({ fill = true, children }: PageBodyProps) => (
  <div className={cn('flex flex-col', fill && 'min-h-0 flex-1')}>{children}</div>
)
