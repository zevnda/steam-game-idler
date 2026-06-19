export type BannerVariant = 'danger' | 'warning' | 'info' | 'success'
export type BannerDismissal = 'session' | 'permanent'

export interface RemoteBannerDef {
  id: string
  variant: BannerVariant
  title?: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
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
  dismissal: BannerDismissal
}
