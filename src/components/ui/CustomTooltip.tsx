import type { ReactNode } from 'react'

import { Tooltip } from '@heroui/react'

import { useUserContext } from '@/components/contexts/UserContext'

interface CustomTooltipProps {
  children: ReactNode
  content: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right' | undefined
  className?: string
  important?: boolean
}

export default function CustomTooltip({
  children,
  content,
  placement = 'bottom',
  className,
  important = false,
}: CustomTooltipProps): ReactNode {
  const { userSettings } = useUserContext()

  if (!important && userSettings.general.disableTooltips) {
    return children
  }

  return (
    <Tooltip
      showArrow
      content={content}
      placement={placement}
      className={`font-semibold bg-[#0a0a0a] text-content ${className}`}
      delay={250}
      closeDelay={100}
      classNames={{
        base: 'pointer-events-none before:bg-[#0a0a0a]!',
        content: 'shadow-none',
      }}
    >
      {children}
    </Tooltip>
  )
}
