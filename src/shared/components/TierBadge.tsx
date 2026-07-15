import type { ProTier } from '@/shared/utils/subscriptionAccess'
import { useTranslation } from 'react-i18next'
import { cn } from '@heroui/react'

interface TierBadgeProps {
  tier: ProTier
  className?: string
}

// Small pill labeling a Pro tier (gamer/casual) or the implicit free tier (`null`) - extracted from
// Sidebar.tsx's plan pill and AchievementUnlockerSettingsTab's inline "Gamer" tag, which had each
// independently grown the exact same markup; SubscriptionSettingsTab is a third caller needing it,
// so this is now the one shared version instead of a third copy-paste.
export const TierBadge = ({ tier, className }: TierBadgeProps) => {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
        tier === 'gamer' && 'bg-purple-500/20 text-purple-400',
        tier === 'casual' && 'bg-sky-500/20 text-sky-400',
        tier === null && 'bg-surface-hover text-muted',
        className,
      )}
    >
      {tier === 'gamer' && t('proMode.tier.gamer.name')}
      {tier === 'casual' && t('proMode.tier.casual.name')}
      {tier === null && t('dashboard.sidebar.tier.free')}
    </span>
  )
}
