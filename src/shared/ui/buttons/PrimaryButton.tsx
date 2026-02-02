import { Button, cn, type ButtonProps } from '@heroui/react'

export function PrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      radius='full'
      className={cn('font-semibold bg-gray-200 text-black', className)}
      {...props}
    />
  )
}
