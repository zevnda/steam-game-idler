import type { ReactElement } from 'react'

import { cn } from '@heroui/react'

interface BetaProps {
  className?: string
}

export default function Beta({ className }: BetaProps): ReactElement {
  return (
    <span
      className={cn(
        'text-[9px] text-black uppercase px-1 py-0.5 select-none',
        'max-w-[30px] max-h-[14px] ml-1 bg-dynamic brightness-125 rounded-full font-semibold',
        className,
      )}
    >
      beta
    </span>
  )
}
