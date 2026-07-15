import type { ReactNode } from 'react'
import { cn } from '@heroui/react'

interface KeyProps {
  children: ReactNode
}

// One physical key badge - `<kbd>` is the semantically correct element for this, not a styled
// `<span>`. Mirrors `main`'s `Key.tsx` shape, restyled onto this project's `border`/`surface`/
// `foreground` design tokens instead of a hardcoded `neutral-700` (`main`'s `text-content` token
// doesn't exist in this rewrite's dark-only palette - see SplashScreen.tsx's own doc comment).
export const Key = ({ children }: KeyProps) => (
  <kbd
    className={cn(
      'inline-flex min-w-8 items-center justify-center rounded border border-border',
      'bg-surface px-2 py-0.5 text-xs font-bold text-foreground uppercase shadow-sm',
    )}
  >
    {children}
  </kbd>
)

interface KeybindProps {
  keys: string[]
}

// A full chord (e.g. `['Ctrl', 'W']`) rendered as adjacent `Key` badges - used by
// KeybindsSettingsTab.tsx for the read-only shortcut reference list.
export const Keybind = ({ keys }: KeybindProps) => (
  <div className='flex items-center gap-1'>
    {keys.map(key => (
      <Key key={key}>{key}</Key>
    ))}
  </div>
)
