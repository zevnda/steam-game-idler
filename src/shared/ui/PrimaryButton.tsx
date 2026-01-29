import { type ReactNode } from 'react'
import { Button, cn, type ButtonProps } from '@heroui/react'

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonProps & { children: ReactNode }) {
  return (
    <Button
      className={cn('font-semibold bg-gray-200 text-gray-800 rounded-full', className)}
      {...props}
    >
      {children}
    </Button>
  )
}
