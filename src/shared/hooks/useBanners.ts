import type { TranslationKey } from '@/i18n'
import type { SubscriptionDetails } from '@/shared/stores/subscriptionStore'
import { useEffect, useState } from 'react'
import { PAYPAL_BILLING_URL, STRIPE_BILLING_URL } from '@/shared/constants'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'

export type BannerVariant = 'danger' | 'warning' | 'info' | 'success' | 'promo'
export type BannerDismissal = 'session' | 'permanent'

// Accent for the `promo` variant only
export type PromoColor =
  'purple' | 'blue' | 'red' | 'orange' | 'green' | 'gold' | 'black-gold' | 'rainbow'

// Shape of `banner.json`, fetched from the live repo (see `fetchRemoteBanner` below) - a
// project-controlled remote promo/announcement banner, editable without a release.
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

interface SystemBannerDef {
  id: string
  variant: BannerVariant
  messageKey: TranslationKey
  ctaLabelKey: TranslationKey
  dismissal: BannerDismissal
  isEligible: (subscriptionDetails: SubscriptionDetails | null) => boolean
}

const systemBanners: SystemBannerDef[] = [
  {
    id: 'pro-past-due',
    variant: 'danger',
    messageKey: 'common.banner.pastDue',
    ctaLabelKey: 'common.banner.manageSubscription',
    dismissal: 'session',
    isEligible: subscriptionDetails => subscriptionDetails?.status === 'past_due',
  },
]

const REMOTE_BANNER_URL =
  'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/banner.json'

// Fetches the remote promo banner once on launch. Its own file so it can live in `banner.json` at
// the repo root and be edited/rolled out without a release, matching `main`'s mechanism exactly.
async function fetchRemoteBanner(
  setRemoteBanner: React.Dispatch<React.SetStateAction<RemoteBannerDef | null>>,
) {
  try {
    const response = await fetch(REMOTE_BANNER_URL)
    if (!response.ok) {
      setRemoteBanner(null)
      return
    }
    const data: Partial<RemoteBannerDef> = await response.json()
    const banner = data?.id && data?.message ? (data as RemoteBannerDef) : null
    setRemoteBanner(banner)
  } catch {
    setRemoteBanner(null)
  }
}

const DISMISSED_BANNERS_KEY = 'dismissedBanners'

function getPermanentlyDismissedBanners() {
  const stored = localStorage.getItem(DISMISSED_BANNERS_KEY)
  const dismissed: string[] = stored ? JSON.parse(stored) : []
  return dismissed
}

// Resolves the one bottom-of-screen banner to show, if any: a past-due-subscription alert takes
// priority over the remote promo banner (both share the same slot - only one banner shows at a
// time, matching `main`). `t()` is applied by the caller (`Banner.tsx`) since this hook only
// returns translation keys for system banners, not rendered strings.
export function useBanners() {
  const subscriptionDetails = useSubscriptionStore(state => state.subscriptionDetails)
  const [remoteBanner, setRemoteBanner] = useState<RemoteBannerDef | null>(null)
  const [sessionDismissed, setSessionDismissed] = useState<Set<string>>(new Set())
  // Starts empty and is populated from an effect, not the `useState` initializer - `localStorage`
  // doesn't exist during Next.js's server-side render pass (this crashed `next dev`'s SSR pass
  // with `ReferenceError: localStorage is not defined` before this fix), same reasoning as
  // `sidebarStore`'s `hydrate()`.
  const [permanentlyDismissed, setPermanentlyDismissed] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchRemoteBanner(setRemoteBanner)
  }, [])

  useEffect(() => {
    setPermanentlyDismissed(getPermanentlyDismissedBanners())
  }, [])

  useEffect(() => {
    // Give the app a moment to settle before showing any banner, system or remote
    const timer = setTimeout(() => setReady(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const eligibleSystemBanner = systemBanners.find(
    banner => banner.isEligible(subscriptionDetails) && !sessionDismissed.has(banner.id),
  )

  const eligibleRemoteBanner =
    remoteBanner?.enabled &&
    !sessionDismissed.has(remoteBanner.id) &&
    !permanentlyDismissed.includes(remoteBanner.id)
      ? remoteBanner
      : null

  const activeBanner:
    (ActiveBanner & { messageKey?: TranslationKey; ctaLabelKey?: TranslationKey }) | null = ready
    ? eligibleSystemBanner
      ? {
          id: eligibleSystemBanner.id,
          variant: eligibleSystemBanner.variant,
          message: '',
          messageKey: eligibleSystemBanner.messageKey,
          ctaLabelKey: eligibleSystemBanner.ctaLabelKey,
          ctaUrl:
            subscriptionDetails?.paymentProvider === 'paypal'
              ? PAYPAL_BILLING_URL
              : STRIPE_BILLING_URL,
          dismissal: eligibleSystemBanner.dismissal,
        }
      : eligibleRemoteBanner
    : null

  const dismiss = (banner: ActiveBanner) => {
    if (banner.dismissal === 'permanent') {
      const updated = [...permanentlyDismissed, banner.id]
      setPermanentlyDismissed(updated)
      localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify(updated))
    } else {
      setSessionDismissed(prev => new Set(prev).add(banner.id))
    }
  }

  return { activeBanner, dismiss }
}
