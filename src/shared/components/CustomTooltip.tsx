import type React from 'react'
import { Tooltip } from '@heroui/react'
import { useUserStore } from '@/shared/stores'

interface CustomTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  important?: boolean
}

export function CustomTooltip({
  children,
  content,
  placement = 'bottom',
  className,
  important = false,
}: CustomTooltipProps) {
  const userSettings = useUserStore(s => s.userSettings)

  if (!important && userSettings.general.disableTooltips) return children as React.ReactElement

  return (
    <Tooltip
      showArrow
      content={content}
      placement={placement}
      className={`font-semibold bg-surface text-content rounded-xl px-3 py-1.5 ${className ?? ''}`}
      delay={250}
      closeDelay={100}
      classNames={{ base: 'pointer-events-none before:bg-surface!', content: 'shadow-none' }}
    >
      {children as React.ReactElement}
    </Tooltip>
  )
}
