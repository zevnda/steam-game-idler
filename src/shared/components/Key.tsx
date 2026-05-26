import type { ReactNode } from 'react'

interface KeyProps {
  children: ReactNode
}

export const Key = ({ children }: KeyProps) => (
  <kbd className='inline-flex items-center justify-center px-2 py-0.5 min-w-8 text-xs font-bold text-white uppercase bg-neutral-700 rounded border border-white/10 shadow-[0_2px_0_rgba(0,0,0,0.5)]'>
    {children}
  </kbd>
)

interface KeybindProps {
  keys: string[]
}

export const Keybind = ({ keys }: KeybindProps) => (
  <div className='flex items-center gap-1'>
    {keys.map(k => (
      <Key key={k}>{k}</Key>
    ))}
  </div>
)
