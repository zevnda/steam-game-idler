import type { ReactElement } from 'react'

import { cn } from '@heroui/react'

import { useUserContext } from '@/components/contexts/UserContext'

export default function ProBadge({ className }: { className?: string }): ReactElement {
  const { isPro } = useUserContext()

  return (
    <span
      className={cn('inline-block rounded-full px-2 ml-1 font-black text-white italic', className)}
      style={{
        backgroundImage: isPro
          ? 'linear-gradient(90deg, hsl(var(--heroui-dynamic) / 0.2) 0%, hsl(var(--heroui-dynamic) / 0.8) 100%)'
          : 'linear-gradient(90deg, #29460aff 0%, #5f9723ff 40%, #77b832ff 70%, #a5f84cff 100%)',
      }}
    >
      PRO
    </span>
  )
}

// #29460aff 0%, #5f9723ff 40%, #77b832ff 70%, #a5f84cff 100%
