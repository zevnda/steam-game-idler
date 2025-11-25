import type { ReactElement } from 'react'

import { cn } from '@heroui/react'

export default function ProBadge({ className }: { className?: string }): ReactElement {
  return (
    <span
      className={cn('inline-block rounded-full px-2 ml-1 font-black text-white italic', className)}
      style={{
        backgroundImage: 'linear-gradient(120deg, #700084ff 0%, #7e15ffff 40%, #0095ffff 85%, #00a2c3ff 100%)',
      }}
    >
      PRO
    </span>
  )
}
