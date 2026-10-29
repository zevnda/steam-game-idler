'use client'

import type { ProTier } from '@/app/lib/analytics'
import { BsStripe } from 'react-icons/bs'
import { FaArrowRight } from 'react-icons/fa6'
import { rememberCheckout, trackEvent } from '@/app/lib/analytics'

interface StripeButtonProps {
  tier: ProTier
  url: string
  className?: string
}

export default function StripeButton({ tier, url, className }: StripeButtonProps) {
  // Deliberately no preventDefault-and-wait: GA's `event_callback` fires as soon as the request
  // *starts*, so redirecting from it aborted the hit mid-flight (net::ERR_ABORTED, never recorded).
  // Left alone, gtag queues the event and flushes its queue with sendBeacon on page unload, which
  // survives the navigation to Stripe - the same way GA's own outbound-click event gets through.
  const handleClick = () => {
    rememberCheckout(tier, 'stripe')
    trackEvent('pro_checkout_start', { tier, provider: 'stripe' })
  }

  return (
    <a
      href={url}
      onClick={handleClick}
      className={className}
      style={{ background: 'linear-gradient(110deg, #635bff, #7a73ff)' }}
    >
      <BsStripe className='w-4 h-4' />
      Stripe
      <FaArrowRight className='w-4 h-4' />
    </a>
  )
}
