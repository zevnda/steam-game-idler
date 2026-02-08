import { cn } from '@heroui/react'

interface BetaProps {
  className?: string
}

export const Beta = ({ className }: BetaProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center align-middle text-[9px] text-dynamic uppercase px-1 select-none',
        'max-w-7.5 h-4 ml-1 bg-dynamic/30 rounded font-semibold',
        className,
      )}
    >
      beta
    </span>
  )
}
