import { cn } from '@heroui/react'

interface ProBadgeProps {
  className?: string
  requiredTier?: 'casual' | 'gamer'
}

export const ProBadge = ({ className, requiredTier = 'casual' }: ProBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 font-black text-white italic select-none',
        className,
      )}
      style={{
        backgroundImage:
          requiredTier === 'gamer'
            ? 'linear-gradient(100deg, #3b0764ff 0%, #6b21a8ff 40%, #9333eaff 70%, #c026d3ff 100%)'
            : 'linear-gradient(100deg, #154d66ff 0%, #227ca5ff 40%, #2eabe5ff 70%, #34bfffff 100%)',
      }}
    >
      {requiredTier === 'gamer' ? 'GAMER' : 'CASUAL'}
    </span>
  )
}
