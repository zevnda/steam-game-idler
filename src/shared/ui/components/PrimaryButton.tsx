import { Button, cn } from '@heroui/react'
import type { ReactNode } from 'react'

interface ButtonProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onPress?: () => void
  children: ReactNode
}

export default function PrimaryButton({
  children,
  size = 'sm',
  onPress,
  className = '',
}: ButtonProps) {
  return (
    <Button
      size={size}
      onPress={onPress}
      className={cn('font-semibold bg-gray-200 text-gray-800 rounded-full', className)}
    >
      {children}
    </Button>
  )
}
