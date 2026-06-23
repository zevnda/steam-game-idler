'use client'

import { useState } from 'react'
import { FaArrowRight, FaPaypal } from 'react-icons/fa6'

interface PayPalButtonProps {
  tier: 'casual' | 'gamer'
  className?: string
}

export default function PayPalButton({ tier, className }: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('https://apibase.vercel.app/api/paypal-create-subscription', {
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
