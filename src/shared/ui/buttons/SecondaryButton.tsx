import { Button, cn, type ButtonProps } from '@heroui/react'

export function SecondaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant='bordered'
      radius='full'
      className={cn('font-semibold text-content border-white', className)}
      {...props}
    />
  )
}
