import type { ReactElement } from 'react'

import { cn } from '@heroui/react'

interface BetaProps {
  className?: string
}

export default function Beta({ className }: BetaProps): ReactElement {
  return (
    <span
      className={cn(
        'text-[10px] text-black uppercase px-1 py-0.5 select-none',
        'max-w-[29px] ml-1 bg-dynamic brightness-125 rounded-md',
        className,
      )}
    >
      beta
    </span>
  )
}
