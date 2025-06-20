import type { ReactElement } from 'react'

import { cn } from '@heroui/react'

export default function Beta(): ReactElement {
  return (
    <span
      className={cn(
        'text-[9px] px-1 select-none max-w-[29px] h-[15px] mb-4',
        'border border-dynamic rounded-full text-dynamic align-top',
      )}
    >
      beta
    </span>
  )
}
