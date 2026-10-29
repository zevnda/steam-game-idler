'use client'

import type { ProTier } from '@/app/lib/analytics'
import { useState } from 'react'
import { FaArrowRight, FaPaypal } from 'react-icons/fa6'
import { rememberCheckout, trackEvent } from '@/app/lib/analytics'

interface PayPalButtonProps {
  tier: ProTier
  className?: string
}

export default function PayPalButton({ tier, className }: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    // sent now, not after the redirect: the API round-trip below gives the hit time to go out
    rememberCheckout(tier, 'paypal')
    trackEvent('pro_checkout_start', { tier, provider: 'paypal' })
    try {
      const res = await fetch('https://api.steamgameidler.com/api/paypal-create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
        return
      }
    } catch (error) {
      console.error('Error creating PayPal subscription:', error)
    }
    setIsLoading(false)
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      style={{ background: 'linear-gradient(110deg, #003087, #0070ba)' }}
    >
      {!isLoading ? (
        <span className='flex gap-2'>
          <FaPaypal className='w-4 h-4' />
          PayPal
          <FaArrowRight className='w-4 h-4' />
        </span>
      ) : (
        <span>Redirecting..</span>
      )}
    </button>
  )
}
