'use client'

import type { CheckoutProvider } from '@/app/lib/analytics'
import { useEffect } from 'react'
import { takeCheckout, trackEvent } from '@/app/lib/analytics'

/** Fires `pro_checkout_complete` once per purchase on a checkout return page (see `takeCheckout`). */
export default function CheckoutCompleteTracker({ provider }: { provider: CheckoutProvider }) {
  useEffect(() => {
    const pending = takeCheckout()
    if (pending) trackEvent('pro_checkout_complete', { tier: pending.tier, provider })
  }, [provider])

  return null
}
