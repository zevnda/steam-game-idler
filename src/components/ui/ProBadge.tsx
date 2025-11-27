import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useUserStore } from '@/stores/userStore'

export default function ProBadge({ className }: { className?: string }): ReactElement {
  const { isPro } = useUserStore()

  return (
    <span
      className={cn('inline-block rounded-full px-2 ml-1 font-black text-white italic', className)}
      style={{
        backgroundImage: isPro
          ? 'linear-gradient(90deg, hsl(var(--heroui-dynamic) / 0.2) 0%, hsl(var(--heroui-dynamic) / 0.8) 100%)'
          : 'linear-gradient(100deg, #154d66ff 0%, #227ca5ff 40%, #2eabe5ff 70%, #34bfffff 100%)',
      }}
    >
      PRO
    </span>
  )
}
