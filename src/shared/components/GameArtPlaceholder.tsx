import type { ReactNode } from 'react'
import { Logo } from '@/shared/components/dashboard/Logo'

interface GameArtPlaceholderProps {
  children?: ReactNode
}

// Stands in for a game with no usable art, in both the landscape thumbnail and the portrait card.
export const GameArtPlaceholder = ({ children }: GameArtPlaceholderProps) => (
  <div className='relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-linear-to-br from-surface-secondary via-surface to-surface'>
    {/* Off-center glow + a faint diagonal hatch give the placeholder some depth instead of a flat
        fill - purely decorative, no semantic meaning to the pattern itself. */}
    <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,color-mix(in_oklch,var(--surface-tertiary)_65%,transparent)_0%,transparent_65%)]' />
    <div className='pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--foreground)_0,var(--foreground)_1px,transparent_1px,transparent_11px)] opacity-[0.05]' />
    <div className='relative flex size-11 items-center justify-center rounded-full border border-border/60 bg-surface-secondary/70 text-foreground/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'>
      <Logo className='opacity-45' height={20} width={20} />
    </div>
    {children}
  </div>
)
