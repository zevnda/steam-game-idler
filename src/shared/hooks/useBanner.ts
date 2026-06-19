import type { ProDetails } from '@/shared/stores'
import type { ActiveBanner, RemoteBannerDef } from '@/shared/types'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/shared/stores'

interface SystemBannerDef extends ActiveBanner {
  isEligible: (proDetails: ProDetails | null) => boolean
}

const STRIPE_BILLING_URL = 'https://billing.stripe.com/p/login/8x23cwf8CeNE6PLaAecbC00'
const PAYPAL_BILLING_URL = 'https://www.paypal.com/myaccount/autopay/'

const systemBanners: SystemBannerDef[] = [
  {
    id: 'pro-past-due',
    variant: 'danger',
    message:
      'Your PRO subscription is past due. Please update your payment method to avoid losing access.',
    ctaLabel: 'Manage Subscription',
    dismissal: 'session',
    isEligible: proDetails => proDetails?.status === 'past_due',
  },
]

// Fetch the remote banner once on launch
const fetchRemoteBanner = async (
  setRemoteBanner: React.Dispatch<React.SetStateAction<RemoteBannerDef | null>>,
) => {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/banner.json',
    )
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

const getDismissedBanners = () => {
  const dismissedBannersStr = localStorage.getItem('dismissedBanners')
  const dismissed: string[] = dismissedBannersStr ? JSON.parse(dismissedBannersStr) : []
  return dismissed
}

export const useBanners = () => {
  const proDetails = useUserStore(state => state.proDetails)
  const [remoteBanner, setRemoteBanner] = useState<RemoteBannerDef | null>(null)
  const [sessionDismissed, setSessionDismissed] = useState<Set<string>>(new Set())
  const [permanentlyDismissed, setPermanentlyDismissed] = useState<string[]>(getDismissedBanners)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchRemoteBanner(setRemoteBanner)
  }, [])

  useEffect(() => {
    // Give the app a moment to settle before showing any banner, system or remote
    const timer = setTimeout(() => setReady(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const eligibleSystemBanner = systemBanners.find(
    banner => banner.isEligible(proDetails) && !sessionDismissed.has(banner.id),
  )

  const eligibleRemoteBanner =
    remoteBanner?.enabled &&
    !sessionDismissed.has(remoteBanner.id) &&
    !permanentlyDismissed.includes(remoteBanner.id)
      ? remoteBanner
      : null

  const activeBanner: ActiveBanner | null = ready
    ? eligibleSystemBanner
      ? {
          ...eligibleSystemBanner,
          ctaUrl:
            proDetails?.paymentProvider === 'paypal' ? PAYPAL_BILLING_URL : STRIPE_BILLING_URL,
        }
      : eligibleRemoteBanner
    : null

  const dismiss = (banner: ActiveBanner) => {
    if (banner.dismissal === 'permanent') {
      const updated = [...permanentlyDismissed, banner.id]
      setPermanentlyDismissed(updated)
      localStorage.setItem('dismissedBanners', JSON.stringify(updated))
    } else {
      setSessionDismissed(prev => new Set(prev).add(banner.id))
    }
  }

  return { activeBanner, dismiss }
}
