import type { ButtonProps } from '@heroui/react'
import { Button, cn } from '@heroui/react'

export const PrimaryButton = ({ className, ...props }: ButtonProps) => {
  return (
    <Button
      className={cn('font-semibold bg-gray-200 text-gray-800 rounded-full', className)}
      {...props}
    />
  )
}
