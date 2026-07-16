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
// so this is now the one shared version instead of a third copy-paste. Gradient colors/typography
// mirror docs/app/(marketing)/pro/_components/FeatureDetailsSection.tsx's tier badge, so the same
// "Casual"/"Gamer" pill reads identically on the marketing site and in-app. `leading-none` is
// required, not cosmetic - several call sites (e.g. SettingsRow's `title` prop) render this badge
// nested inside a HeroUI `Typography` paragraph, whose line-height would otherwise inherit down and
// inflate the pill's height well past its padding.
export const TierBadge = ({ tier, className }: TierBadgeProps) => {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest leading-3.5',
        tier === 'gamer' && 'bg-[linear-gradient(90deg,#8f00ff,#9c27b0)] text-white',
        tier === 'casual' && 'bg-[linear-gradient(90deg,#3b82f6,#38bdf8)] text-white',
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
