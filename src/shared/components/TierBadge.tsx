import type { ProTier } from '@/shared/utils/subscriptionAccess'
import { useTranslation } from 'react-i18next'
import { cn } from '@heroui/react'
import { usePlatformStore } from '@/shared/stores/platformStore'

interface TierBadgeProps {
  tier: ProTier
  className?: string
}

// Small pill labeling a Pro tier (gamer/casual) or the implicit free tier (`null`) - the one shared
// version for every tier gate and the subscription tab. Styled as the PRO pill in the tier's own
// colours (globals.css `.tier-badge`: a turning 1px rim over an almost-clear tint); the website's
// tier badges (docs FeatureDetailsSection.tsx) mirror it, so "Casual"/"Gamer" read identically on
// the marketing site and in-app. `leading-3.5` is required, not cosmetic - several call sites (e.g.
// SettingsRow's `title` prop) render this badge nested inside a HeroUI `Typography` paragraph,
// whose line-height would otherwise inherit down and inflate the pill's height well past its
// padding. The rim's turn stops under either reduced-motion mechanism (see globals.css's
// `.force-reduced-motion` comment).
export const TierBadge = ({ tier, className }: TierBadgeProps) => {
  const { t } = useTranslation()
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true

  return (
    <span
      className={cn(
        'tier-badge select-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest leading-3.5',
        tier === 'gamer' && 'tier-badge--gamer',
        tier === 'casual' && 'tier-badge--casual',
        tier === null && 'text-muted',
        forceReducedMotion && 'force-reduced-motion',
        className,
      )}
    >
      {tier === 'gamer' && t('proMode.tier.gamer.name')}
      {tier === 'casual' && t('proMode.tier.casual.name')}
      {tier === null && t('dashboard.sidebar.tier.free')}
    </span>
  )
}
