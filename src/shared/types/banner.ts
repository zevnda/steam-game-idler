export type BannerVariant = 'danger' | 'warning' | 'info' | 'success' | 'promo'
export type BannerDismissal = 'session' | 'permanent'

// Accent for the `promo` variant only
export type PromoColor =
  | 'purple'
  | 'blue'
  | 'red'
  | 'orange'
  | 'green'
  | 'gold'
  | 'black-gold'
  | 'rainbow'

export interface RemoteBannerDef {
  id: string
  variant: BannerVariant
  title?: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
  asset?: string
  color?: PromoColor
  dismissal: BannerDismissal
  enabled: boolean
}

export interface ActiveBanner {
  id: string
  variant: BannerVariant
  title?: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
  asset?: string
  color?: PromoColor
  dismissal: BannerDismissal
}
