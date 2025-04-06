import type { ReactElement, ReactNode } from 'react'

import { Tooltip } from '@heroui/react'

interface CustomTooltipProps {
  children: ReactNode
  content: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right' | undefined
  className?: string
}

export default function CustomTooltip({
  children,
  content,
  placement = 'bottom',
  className,
}: CustomTooltipProps): ReactElement {
  return (
    <Tooltip
      showArrow
      content={content}
      placement={placement}
      className={`font-semibold bg-[#0a0a0a] ${className}`}
      delay={250}
      closeDelay={100}
      classNames={{
        base: 'pointer-events-none before:!bg-[#0a0a0a]',
        content: 'shadow-none text-offwhite',
      }}
    >
      {children}
    </Tooltip>
  )
}
