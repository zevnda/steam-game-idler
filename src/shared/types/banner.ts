export type BannerVariant = 'danger' | 'warning' | 'info' | 'success' | 'promo'
export type BannerDismissal = 'session' | 'permanent'

export interface RemoteBannerDef {
  id: string
  variant: BannerVariant
  title?: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
  asset?: string
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
  dismissal: BannerDismissal
}
