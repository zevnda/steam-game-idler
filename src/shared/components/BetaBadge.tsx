import { useTranslation } from 'react-i18next'
import { cn } from '@heroui/react'

interface BetaBadgeProps {
  className?: string
}

// Small pill flagging a newly-added, not-yet-battle-tested setting/feature - visually mirrors
// TierBadge's pill (same padding/typography) so the two read as one consistent "small inline tag"
// language, but is its own component rather than a new `TierBadge` variant: `TierBadge`'s `tier`
// prop is `ProTier` (`'casual' | 'gamer' | null`), tightly coupled to subscription-tier logic
// elsewhere (`hasCasualAccess`/`hasGamerAccess`) - "beta" isn't a tier and needs no gating check, so
// forcing it into that type would conflate two unrelated concepts. `leading-none` for the same
// reason TierBadge needs it - several call sites nest this inside a HeroUI `Typography` title.
export const BetaBadge = ({ className }: BetaBadgeProps) => {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'rounded-full bg-[linear-gradient(90deg,#616161,#5c5c5c)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest leading-3.5 text-white',
        className,
      )}
    >
      {t('common.badges.beta')}
    </span>
  )
}
